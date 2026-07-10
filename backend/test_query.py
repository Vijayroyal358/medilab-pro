import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.db import engine
from app.models.models import User

with Session(engine) as session:
    users = session.exec(select(User)).all()
    print("Users in database:")
    for u in users:
        print(f"ID: {u.id}, Name: {u.name}, Email: {u.email}, Role: {u.role}")
