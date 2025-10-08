# create_tables.py

from app.core.database import engine, Base
from app.models import user, history  # <-- important!

Base.metadata.create_all(bind=engine)
