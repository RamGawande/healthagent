"""
Simple script to run the Medical Assistant backend server
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8009,
        reload=False  # Set to True for development with auto-reload
    )

