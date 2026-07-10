from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.db import get_db
from app.models.models import User, Patient, Test, Appointment, Report, AuditLog, Expense, ReferralDoctor
from app.schemas.schemas import DashboardStats, WeeklyPatientStat, WeeklyRevenueStat, DashboardActivity
from app.routers.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

staff_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    lab_id = current_user.lab_id
    today = datetime.utcnow().strftime("%Y-%m-%d")
    
    # 1. Today's Patients count
    today_patients_count = db.exec(
        select(func.count(Patient.id))
        .where(Patient.lab_id == lab_id)
        .where(Patient.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
    ).one()
    
    # 2. Today's Appointments count
    today_appointments_count = db.exec(
        select(func.count(Appointment.id))
        .where(Appointment.lab_id == lab_id)
        .where(Appointment.appointment_date.like(f"{today}%"))
    ).one()
    
    # 3. Reports count
    pending_reports_count = db.exec(
        select(func.count(Report.id))
        .where(Report.lab_id == lab_id)
        .where(Report.status.in_(["Pending", "Processing"]))
    ).one()
    
    completed_reports_count = db.exec(
        select(func.count(Report.id))
        .where(Report.lab_id == lab_id)
        .where(Report.status == "Completed")
    ).one()
    
    # 4. Revenue & Payment split calculations
    # Fetch tests registered today
    today_tests = db.exec(
        select(Test)
        .where(Test.lab_id == lab_id)
        .where(Test.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
    ).all()
    
    today_revenue = 0.0
    revenue_split = {"Cash": 0.0, "Card": 0.0, "UPI": 0.0}
    
    for t in today_tests:
        # Sum up actual amount received today
        amt = t.amount_received
        today_revenue += amt
        
        # Attribute to split
        method = t.payment_method or "Cash"
        if method in revenue_split:
            revenue_split[method] += amt
        else:
            revenue_split["Cash"] += amt
            
    # Pending payments
    all_pending_tests = db.exec(
        select(Test)
        .where(Test.lab_id == lab_id)
        .where(Test.balance_due > 0)
        .where(Test.status != "Canceled")
    ).all()
    pending_payments = sum([t.balance_due for t in all_pending_tests])
    
    # 5. Expenses Registered Today
    today_expenses_list = db.exec(
        select(Expense)
        .where(Expense.lab_id == lab_id)
        .where(Expense.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
    ).all()
    today_expenses = sum([e.amount for e in today_expenses_list])
    
    # 6. Referral Doctor Commissions Today
    today_commissions = 0.0
    for t in today_tests:
        if t.referral_doctor_id:
            doc = db.get(ReferralDoctor, t.referral_doctor_id)
            if doc:
                discount_val = t.discount
                if t.discount_type == "percentage":
                    discount_val = (t.price * t.discount / 100.0)
                net_billed = t.price - discount_val
                today_commissions += (net_billed * doc.commission_percentage / 100.0)
                
    # 7. Weekly Patients and Revenue metrics (Dynamic from DB)
    weekly_patients = []
    weekly_revenue = []
    today_dt = datetime.utcnow()
    
    # We query the last 7 days chronologically (6 days ago -> today)
    for i in range(6, -1, -1):
        day_date = today_dt - timedelta(days=i)
        day_name = day_date.strftime("%a") # e.g. "Mon", "Tue"
        start_of_day = day_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = day_date.replace(hour=23, minute=59, second=59, microsecond=999)
        
        p_count = db.exec(
            select(func.count(Patient.id))
            .where(Patient.lab_id == lab_id)
            .where(Patient.created_at >= start_of_day)
            .where(Patient.created_at <= end_of_day)
        ).one()
        
        r_sum = db.exec(
            select(func.sum(Test.amount_received))
            .where(Test.lab_id == lab_id)
            .where(Test.created_at >= start_of_day)
            .where(Test.created_at <= end_of_day)
        ).one() or 0.0
        
        weekly_patients.append(WeeklyPatientStat(day=day_name, patients=p_count))
        weekly_revenue.append(WeeklyRevenueStat(day=day_name, revenue=float(r_sum)))
        
    # 8. Recent Activities
    stmt = (
        select(AuditLog, User.name)
        .join(User, AuditLog.user_id == User.id, isouter=True)
        .where(AuditLog.lab_id == lab_id)
        .order_by(AuditLog.created_at.desc())
        .limit(10)
    )
    activities_results = db.exec(stmt).all()
    
    recent_activities = []
    for log, u_name in activities_results:
        time_str = log.created_at.strftime("%H:%M")
        user_display = u_name if u_name else "System"
        recent_activities.append(
            DashboardActivity(
                time=time_str,
                user=user_display,
                action=log.action,
                details=log.details or ""
            )
        )
        
    if not recent_activities:
        recent_activities.append(
            DashboardActivity(
                time=datetime.utcnow().strftime("%H:%M"),
                user="System",
                action="INITIALIZED",
                details="MediLabsPro system dashboard initialized."
            )
        )
        
    # 9. List of Payments Due
    payments_due_list = []
    for t in all_pending_tests[:20]: # Limit to top 20
        pat = db.get(Patient, t.patient_id)
        payments_due_list.append({
            "id": t.id,
            "patient_name": pat.name if pat else f"Patient #{t.patient_id}",
            "invoice_number": t.invoice_number,
            "test_name": t.test_name,
            "balance_due": t.balance_due,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
        })
        
    # 10. Recent Transactions Today
    recent_transactions = []
    # Fetch tests updated or created today where amount_received > 0
    today_received_tests = db.exec(
        select(Test)
        .where(Test.lab_id == lab_id)
        .where(Test.amount_received > 0)
        .where(Test.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
        .order_by(Test.created_at.desc())
    ).all()
    
    for t in today_received_tests[:20]:
        pat = db.get(Patient, t.patient_id)
        recent_transactions.append({
            "id": t.id,
            "patient_name": pat.name if pat else f"Patient #{t.patient_id}",
            "amount_paid": t.amount_received,
            "payment_method": t.payment_method or "Cash",
            "time": t.created_at.strftime("%H:%M")
        })
        
    # Calculate samples collected dynamically (any test today with a valid sample type)
    samples_collected_count = db.exec(
        select(func.count(Test.id))
        .where(Test.lab_id == lab_id)
        .where(Test.created_at >= datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0))
        .where(Test.sample_type != None)
        .where(Test.sample_type != "None")
    ).one()

    # Calculate test category statistics dynamically
    category_counts = db.exec(
        select(Test.category, func.count(Test.id))
        .where(Test.lab_id == lab_id)
        .group_by(Test.category)
    ).all()
    
    total_tests_count = sum([count for cat, count in category_counts])
    test_stats_dict = {}
    if total_tests_count > 0:
        for cat, count in category_counts:
            # e.g., "Hematology" -> percentage of total tests
            test_stats_dict[cat] = round((count / total_tests_count) * 100, 1)
    else:
        test_stats_dict = {"Hematology": 35.0, "Biochemistry": 30.0, "Microbiology": 15.0, "Immunology": 10.0, "Others": 10.0}

    # Query today's appointments list dynamically
    today_appointments_results = db.exec(
        select(Appointment)
        .where(Appointment.lab_id == lab_id)
        .where(Appointment.appointment_date.like(f"{today}%"))
    ).all()
    
    today_appointments_list = []
    for appt in today_appointments_results:
        pat = db.get(Patient, appt.patient_id)
        today_appointments_list.append({
            "id": appt.id,
            "time": appt.appointment_date[11:16], # Extract time HH:MM
            "patient_name": pat.name if pat else "Unknown",
            "test_name": appt.notes or "General Consultation",
            "status": appt.status
        })

    # Calculate footer metrics dynamically from DB
    active_patients_count = db.exec(
        select(func.count(Patient.id))
        .where(Patient.lab_id == lab_id)
    ).one()
    
    total_reports_count = db.exec(
        select(func.count(Report.id))
        .where(Report.lab_id == lab_id)
    ).one()
    
    start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    tests_this_month_count = db.exec(
        select(func.count(Test.id))
        .where(Test.lab_id == lab_id)
        .where(Test.created_at >= start_of_month)
    ).one()
    
    monthly_collections = db.exec(
        select(func.sum(Test.amount_received))
        .where(Test.lab_id == lab_id)
        .where(Test.created_at >= start_of_month)
    ).one() or 0.0

    return DashboardStats(
        today_patients=today_patients_count,
        today_appointments=today_appointments_count,
        pending_reports=pending_reports_count,
        completed_reports=completed_reports_count,
        today_revenue=today_revenue,
        pending_payments=pending_payments,
        today_expenses=today_expenses,
        today_commissions=today_commissions,
        today_revenue_split=revenue_split,
        weekly_patients=weekly_patients,
        weekly_revenue=weekly_revenue,
        recent_activities=recent_activities,
        payments_due=payments_due_list,
        recent_transactions=recent_transactions,
        samples_collected=samples_collected_count,
        test_statistics=test_stats_dict,
        today_appointments_list=today_appointments_list,
        active_patients_count=active_patients_count,
        total_reports_count=total_reports_count,
        tests_this_month_count=tests_this_month_count,
        monthly_collections=float(monthly_collections)
    )
