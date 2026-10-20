# Armario - Mobile-First PWA

App Web Mobile-First (PWA instalable) para gestionar tu ropa, guardar tus prendas en el dispositivo y generar recomendaciones de outfits/looks en función del clima y la ocasión.

## 🚀 Características
- **Persistencia Local Completa**: Usa IndexedDB para prendas, fotos comprimidas y outfits guardados.
- **Blueprint Minimal Aesthetic**: Diseño técnico plano con tonalidades crema (`#F4F1EA`), bordes finos, tipografía condensada y soporte de marcas técnicas.
- **Clima Automático**: Integración con API de Open-Meteo (confallback en Vitoria-Gasteiz).
- **Algoritmo de Sugerencia Inteligente**: Selecciona según clima y ocasión priorizando prendas menos utilizadas o no usadas recientemente.
- **Respaldo & Exportación**: Exporta e importa copias de seguridad en formato `.json` con tus fotos en Base64.
- **PWA Off-line**: Lista para instalarse en la pantalla de inicio del teléfono celular.

---

## 🛠️ Instrucciones para ejecutar en Visual Studio Code (Local)

1. **Descomprimir el archivo ZIP** en tu computadora.
2. Abre la carpeta del proyecto en **Visual Studio Code**.
3. Abre la terminal integrada (`Ctrl + ~` o `Cmd + ~`) y ejecuta:

```bash
npm install
```

4. Inicia el servidor de desarrollo local:

```bash
npm run dev
```

5. Abre en tu navegador el enlace mostrado en la terminal (ejemplo: `http://localhost:5173`).

---

## 🌐 Cómo publicar GRATIS en Vercel o Netlify

### Opción A: Vercel (Recomendado)
1. Sube tu proyecto a un repositorio privado o público en **GitHub**.
2. Entra a [Vercel](https://vercel.com/) e inicia sesión con GitHub.
3. Haz clic en **"Add New" -> "Project"** e importa el repositorio de Armario.
4. Vercel detectará automáticamente Vite. Haz clic en **"Deploy"**.
5. ¡Listo! Abre el enlace generado desde el navegador Chrome/Safari de tu celular y presiona **"Agregar a pantalla de inicio"** para instalar la PWA.

### Opción B: Netlify
1. Ejecuta localmente `npm run build` para generar la carpeta `dist`.
2. Ve a [Netlify Drop](https://app.netlify.com/drop).
3. Arrastra la carpeta `dist` directamente al sitio de Netlify.
