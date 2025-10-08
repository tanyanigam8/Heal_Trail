from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int  # ✅ Added to fix frontend localStorage issue

# Optional: test model standalone
if __name__ == "__main__":
    test_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "test123"
    }
    user = UserCreate(**test_data)
    print(user)
