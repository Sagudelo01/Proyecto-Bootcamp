📘 Guía completa para conectar un proyecto a GitHub y trabajar con ramas

1. Instalar Git  
https://git-scm.com/download/win

2. Abrir la terminal y moverse a la carpeta del proyecto  
Ejemplo:  
cd "/c/Users/LINDA/Documents/Proyectofinal1"

3. Inicializar Git  
git init

4. Agregar archivos y hacer el primer commit  
git add .  
git commit -m "Primer commit"

5. Conectar con el repositorio de GitHub  
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git  
git branch -M main  
git push -u origin main

6. Si hay conflicto con GitHub (repositorio con archivos):  
git pull origin main --allow-unrelated-histories  
(Esc → `:wq` → Enter para salir del editor)

7. Subir archivos después del pull:  
git push -u origin main

8. Crear tu propia rama:  
git checkout -b tu-nombre  
git push -u origin tu-nombre

9. Para trabajar en tu rama:  
git add .  
git commit -m "lo que hiciste"  
git push

10. Cuando termines tu parte:  
Haz un Pull Request en GitHub desde tu rama hacia main.