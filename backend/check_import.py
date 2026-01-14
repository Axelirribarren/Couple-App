try:
    from app.schemas.user import UserCreate
    print("Schema import successful")
except Exception as e:
    print(f"Import Error: {e}")
