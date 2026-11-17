export const PASS = 'Demo2026Frio!'
export const usuarios = [
  { email: 'encargado@jgfrio.test', nombre: 'Encargado Operaciones', rol: 'encargado', dosFA: true },
  { email: 'ventas@jgfrio.test', nombre: 'Ejecutivo Ventas', rol: 'ventas' },
  { email: 'csoto@jgfrio.test', nombre: 'C. Soto', rol: 'tecnico', tecId: 2 },
  { email: 'lperez@jgfrio.test', nombre: 'L. Pérez', rol: 'tecnico', tecId: 3 },
  { email: 'admin@jgfrio.test', nombre: 'Admin Sistema', rol: 'admin', dosFA: true },
]
export const tecnicosIni = [
  { id: 1, nombre: 'M. Rojas', zona: 'Los Lagos', esp: 'Refrigeración general', disp: true, nota: 'En base' },
  { id: 2, nombre: 'C. Soto', zona: 'Los Lagos', esp: 'Compresores', disp: true, nota: 'En ruta a Osorno' },
  { id: 3, nombre: 'L. Pérez', zona: 'Maule', esp: 'Control y SITRAD', disp: false, nota: 'En colación' },
]
export const clientes = [
  { id: 1, nombre: 'Lácteos del Sur', rubro: 'Lácteo', zona: 'Los Lagos', equipo: 'Cámara CM-04' },
  { id: 2, nombre: 'Pesquera Austral', rubro: 'Pesquero', zona: 'Los Lagos', equipo: 'Túnel de congelado TC-01' },
  { id: 3, nombre: 'Agrícola Maule', rubro: 'Agroindustrial', zona: 'Maule', equipo: 'Pre-enfriado PE-01' },
  { id: 4, nombre: 'Frigorífico Norte', rubro: 'Cárnico', zona: 'Ñuble', equipo: 'Sala proceso SP-02' },
]
export const historial = [
  { cli: 1, fecha: '2026-06-10', tipo: 'Compresor', desc: 'Falla de arranque compresor' },
  { cli: 1, fecha: '2026-08-22', tipo: 'Compresor', desc: 'Sobrecalentamiento compresor' },
  { cli: 1, fecha: '2026-10-30', tipo: 'Compresor', desc: 'Corte térmico compresor' },
  { cli: 2, fecha: '2026-09-05', tipo: 'Gas', desc: 'Recarga R404A' },
  { cli: 3, fecha: '2026-07-14', tipo: 'Control', desc: 'Cambio controlador digital' },
  { cli: 4, fecha: '2026-03-02', tipo: 'Compresor', desc: 'Cambio de aceite' },
]
export const solicitudesIni = [
  { id: 'SOL-1001', cli: 1, zona: 'Los Lagos', urg: 'Urgente', origen: 'SITRAD', estado: 'Pendiente', tec: null, falla: 'Temperatura sobre -15°C', rep: {}, obs: '', firma: false },
  { id: 'SOL-1002', cli: 2, zona: 'Los Lagos', urg: 'Alta', origen: 'Teléfono', estado: 'Asignada', tec: 2, falla: 'Ruido en ventiladores', rep: {}, obs: '', firma: false },
  { id: 'SOL-1003', cli: 3, zona: 'Maule', urg: 'Normal', origen: 'Web', estado: 'Asignada', tec: 3, falla: 'Mantención preventiva', rep: {}, obs: '', firma: false },
  { id: 'SOL-1004', cli: 4, zona: 'Ñuble', urg: 'Normal', origen: 'WhatsApp', estado: 'Pendiente', tec: null, falla: 'Revisión de puerta', rep: {}, obs: '', firma: false },
]
export const repuestos = ['Compresor 3HP', 'Gas refrigerante R404A', 'Controlador digital']
