from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from app.core.db import get_db
from app.models.models import User, Report
from app.schemas.schemas import ReportResponse, ReportUpdate
from app.routers.deps import get_current_user, RoleChecker
from app.crud.crud import (
    get_reports_in_lab,
    get_reports_for_patient,
    update_report_results,
    create_audit_log
)

router = APIRouter(prefix="/reports", tags=["reports"])

staff_roles = RoleChecker(["Lab Admin", "Receptionist", "Technician", "Doctor"])
edit_roles = RoleChecker(["Lab Admin", "Technician", "Doctor"])

@router.get("/", response_model=List[ReportResponse])
def read_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    return get_reports_in_lab(db, lab_id=current_user.lab_id)

@router.get("/patient", response_model=List[ReportResponse])
def read_my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Patient role can ONLY read their own reports
    if current_user.role != "Patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is reserved for patients"
        )
    return get_reports_for_patient(db, patient_user_id=current_user.id, lab_id=current_user.lab_id)

@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    report_in: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(edit_roles)
):
    report = update_report_results(
        db, 
        report_id=report_id, 
        lab_id=current_user.lab_id, 
        report_in=report_in, 
        user_id=current_user.id
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found in this laboratory")
    return report

@router.get("/{report_id}", response_model=ReportResponse)
def read_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(staff_roles)
):
    report = db.exec(select(Report).where(Report.id == report_id, Report.lab_id == current_user.lab_id)).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    # Inject patient_name and other schema fields
    from app.models.models import Patient, Test
    patient = db.get(Patient, report.patient_id)
    test = db.get(Test, report.test_id)
    
    r_dict = report.model_dump()
    r_dict["patient_name"] = patient.name if patient else None
    r_dict["patient_id_code"] = patient.patient_id if patient else None
    r_dict["test_name"] = test.test_name if test else None
    
    return ReportResponse(**r_dict)

@router.get("/{report_id}/pdf-preview")
def preview_report_pdf(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security: If patient, check that this report belongs to them
    report = db.get(Report, report_id)
    if not report or report.lab_id != current_user.lab_id:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if current_user.role == "Patient":
        # Get patient profile linked to patient user
        from app.models.models import Patient
        patient = db.exec(
            select(Patient).where(Patient.user_id == current_user.id, Patient.lab_id == current_user.lab_id)
        ).first()
        if not patient or report.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Access denied to this report")
            
    from app.models.models import Patient, Test, Lab
    patient = db.get(Patient, report.patient_id)
    test = db.get(Test, report.test_id)
    lab = db.get(Lab, report.lab_id)
    
    return {
        "report_id": report.id,
        "status": report.status,
        "lab_name": lab.name,
        "lab_address": lab.address,
        "lab_phone": lab.phone,
        "lab_email": lab.email,
        "lab_website": lab.website,
        "lab_gstin": lab.gstin,
        "lab_pan": lab.pan,
        "patient_name": patient.name,
        "patient_id": patient.patient_id,
        "patient_age_gender": f"{patient.age} / {patient.gender}",
        "patient_gender": patient.gender,
        "patient_dob": patient.dob,
        "patient_blood_group": patient.blood_group,
        "patient_phone": patient.phone,
        "patient_email": patient.email,
        "patient_address": patient.address,
        "referring_doctor": patient.referring_doctor or test.remarks or "Self",
        "test_name": test.test_name,
        "category": test.category,
        "invoice_number": test.invoice_number,
        "collection_date": test.collection_date,
        "results_data": report.results_data or "Results are currently being processed.",
        "results_json": report.results_json,
        "collected_on": report.collected_on,
        "received_on": report.received_on,
        "reported_on": report.reported_on,
        "interpretation": report.interpretation,
        "test_utility": report.test_utility,
        "notes_and_limitations": report.notes_and_limitations,
        "remarks": report.remarks,
        "advice": report.advice,
        "print_categories_new_page": report.print_categories_new_page,
        "print_results": report.print_results,
        "page_break_after": report.page_break_after,
        "skip_interpretation": report.skip_interpretation,
        "technician_signed": report.technician_id is not None,
        "doctor_signed": report.doctor_id is not None,
        "download_url": f"/api/v1/reports/{report.id}/download"
    }
