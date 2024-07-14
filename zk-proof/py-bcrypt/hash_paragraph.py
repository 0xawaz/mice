import bcrypt
import sys

def hash_text(text):
    # Encode the text to bytes, as bcrypt requires byte input
    text_bytes = text.encode('utf-8')
    # Generate a salt and hash the text
    hashed = bcrypt.hashpw(text_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python hash_paragraph.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    # Read the paragraph from the file
    with open(file_path, 'r') as file:
        text = file.read()

    hashed_text = hash_text(text)
    print(hashed_text)
