from database import engine
from sqlalchemy import text

def check():
    with engine.connect() as conn:
        print("Columns in 'alertes':")
        res = conn.execute(text("DESCRIBE alertes"))
        for row in res:
            print(row)
        
        print("\nColumns in 'incidents':")
        res = conn.execute(text("DESCRIBE incidents"))
        for row in res:
            print(row)

if __name__ == "__main__":
    check()
