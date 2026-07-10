import psycopg2

DATABASE_URL = "postgresql://postgres:Vijay2003%40fmy@db.tkswveavhhgpijpjrvls.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Try inserting a test record into the test table
    cursor.execute("""
        INSERT INTO test (
            lab_id, patient_id, invoice_number, category, test_name, 
            price, discount, discount_type, tax, sample_type, 
            collection_date, expected_delivery, payment_status, 
            payment_method, amount_received, balance_due, remarks, 
            collection_centre, collection_agent, modality, status, created_at
        ) VALUES (
            3, 7, 'CDL-INV-9999', 'Pathology', 'Test name', 
            100.0, 0.0, 'fixed', 0.0, 'Blood', 
            '2026-07-10 12:00', '2026-07-10 18:00', 'Paid', 
            'Cash', 100.0, 0.0, 'Test remarks', 
            'Main', 'Reddy', 'LAB', 'No due', NOW()
        )
    """)
    conn.commit()
    print("Test insert succeeded!")
    
    # Delete the test record
    cursor.execute("DELETE FROM test WHERE invoice_number = 'CDL-INV-9999'")
    conn.commit()
    print("Cleaned up successfully.")
    conn.close()
except Exception as e:
    print(f"Database error during insert: {e}")
