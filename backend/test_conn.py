import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.db import init_db
from app.core.seed import seed_data

print("Connecting to Supabase and running DB init...")
try:
    init_db()
    print("Tables verified / created.")
    seed_data()
    print("Database seeded successfully!")
except Exception as e:
    print(f"Error occurred: {e}")
    sys.exit(1)
