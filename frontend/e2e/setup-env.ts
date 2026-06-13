import dotenv from 'dotenv'
import path from 'path'

// Cargar variables de entorno del backend para que Prisma pueda verlas al importarse
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') })
