import shutil, os

os.makedirs('src/styles', exist_ok=True)
shutil.copyfile('style.css', 'src/styles/main.css')
print("Successfully copied style.css to src/styles/main.css")
