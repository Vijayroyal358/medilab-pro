import psycopg2

DATABASE_URL = "postgresql://postgres:Vijay2003%40fmy@db.tkswveavhhgpijpjrvls.supabase.co:5432/postgres"

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    cursor.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'patient'")
    columns = cursor.fetchall()
    print("Columns in patient table:")
    for col in columns:
        print(f"{col[0]}: {col[1]}")
        
    conn.close()
except Exception as e:
    print(f"Error: {e}")
