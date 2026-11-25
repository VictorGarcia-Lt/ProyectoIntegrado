import { useState, useRef, useEffect } from 'react'
import { LogOut, Play, Loader, CheckCircle2, Wrench, Wifi, WifiOff, ClipboardList } from 'lucide-react'
import { getMisOrdenes, actualizarOrden, subirAdjunto, sincronizarColaOffline } from '../services/terrenoService'
import { getTecnicos, cambiarDisponibilidad } from '../services/operacionesService'
import { getRepuestos } from '../services/api'

const REPUESTOS_BASE = [
  { id: 1, codigo: 'REP-001', nombre: 'Compresor Hermético 3HP', unidad: 'unidad' },
  { id: 2, codigo: 'REP-002', nombre: 'Gas Refrigerante R404A', unidad: 'kg' },
  { id: 3, codigo: 'REP-003', nombre: 'Controlador Digital Full Gauge MT-512E', unidad: 'unidad' },
]

export default function VistaTecnico({ user, logout }) {
  const [tab, setTab] = useState('ord')
  const [off, setOff] = useState(false)
  const [toast, setToast] = useState('')
  const [ordenes, setOrdenes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [catalogo, setCatalogo] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cat_repuestos') || 'null') || REPUESTOS_BASE } catch { return REPUESTOS_BASE }
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [pend, setPend] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pend_' + user.tecId) || '[]') } catch { return [] }
  })
  const [perfil, setPerfil] = useState({ zona: '', nota: '' })
  const [selectedId, setSelectedId] = useState(null)

  const tec = tecnicos.find(t => t.id === user.tecId)

  const flash = m => { setToast(m); setTimeout(() => setToast(''), 2500) }

  const load = async () => {
    setLoading(true); setErr('')
    try {
      const [os, ts] = await Promise.all([getMisOrdenes(), getTecnicos()])
      setOrdenes(os); setTecnicos(ts)
      const t = ts.find(x => x.id === user.tecId)
      if (t) setPerfil({ zona: t.zona, nota: t.nota })
      if (!selectedId && os.length) setSelectedId(os[0].id)

      try {
        const cat = await getRepuestos()
        setCatalogo(cat)
        localStorage.setItem('cat_repuestos', JSON.stringify(cat))
      } catch {
        const guardado = localStorage.getItem('cat_repuestos')
        if (guardado) {
          try { setCatalogo(JSON.parse(guardado)) } catch { setCatalogo(REPUESTOS_BASE) }
        } else {
          setCatalogo(REPUESTOS_BASE)
        }
      }
    } catch (e) { setErr(e.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const toggleOff = async v => {
    setOff(v)
    if (!v && pend.length) {
      try { await sincronizarColaOffline(pend); flash(`${pend.length} cambios sincronizados`) }
      catch (e) { flash('Error al sincronizar: ' + e.message); return }
      setPend([]); localStorage.removeItem('pend_' + user.tecId)
      await load()
    }
  }

  const setDisp = async v => {
    if (!tec) return
    try { await cambiarDisponibilidad(tec.id, v, tec.nota); flash(v ? 'Disponible' : 'No disponible'); await load() }
    catch (e) { flash(e.message) }
  }

  const guardar = async () => {
    if (!tec) return
    try { await cambiarDisponibilidad(tec.id, tec.disponible, perfil.nota); flash('Perfil guardado'); await load() }
    catch (e) { flash(e.message) }
  }

  const cambiar = async (id, cambio, desc, uuid) => {
    if (off) {
      const n = [...pend, { uuid, id, cambio, desc }]
      setPend(n); localStorage.setItem('pend_' + user.tecId, JSON.stringify(n))
      setOrdenes(prev => prev.map(x => x.id === id ? { ...x, ...cambio } : x))
      flash('Guardado offline')
    } else {
      try { await actualizarOrden(id, cambio); flash(desc); await load() }
      catch (e) { flash(e.message) }
    }
  }

  const hechas = ordenes.filter(o => o.estado === 'Finalizado').length
  const selected = ordenes.find(o => o.id === selectedId) || ordenes[0]

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 text-white px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 grid place-items-center"><Wrench size={18} /></div>
          <div>
            <div className="font-extrabold text-lg leading-tight">{tec?.nombre || user.nombre}</div>
            <div className="text-xs text-slate-400">{tec?.especialidad || 'Técnico en terreno'}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${off ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
            <span className={`w-2 h-2 rounded-full ${off ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {off ? `Sin conexión · ${pend.length} pendientes` : 'En línea · Supabase'}
          </span>
          {tec && (
            <button onClick={() => setDisp(!tec.disponible)} className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border transition ${tec.disponible ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25' : 'bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25'}`}>
              <span className={`w-2 h-2 rounded-full ${tec.disponible ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              {tec.disponible ? 'Disponible' : 'No disponible'}
            </button>
          )}
          <button onClick={() => toggleOff(!off)} className="text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 px-3 py-1.5 rounded-lg transition">
            {off ? 'Reconectar' : 'Simular offline'}
          </button>
          <button onClick={logout} className="text-slate-300 hover:text-white"><LogOut size={18} /></button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('ord')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === 'ord' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Mis órdenes</button>
          <button onClick={() => setTab('per')} className={`px-4 py-2 rounded-lg text-sm font-bold transition ${tab === 'per' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Mi perfil</button>
        </div>

        {err && <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">{err}</div>}
        {loading && <p className="text-slate-500 text-sm mb-4">Cargando...</p>}

        {tab === 'per' && tec && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{tec.nombre}</h3>
                <p className="text-sm text-slate-500">{tec.especialidad} · {tec.zona}</p>
              </div>
              <button onClick={() => setDisp(!tec.disponible)} className={`inline-flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-full border transition ${tec.disponible ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${tec.disponible ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                {tec.disponible ? 'Disponible' : 'No disponible'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Zona</label>
                <input value={perfil.zona} onChange={e => setPerfil({ ...perfil, zona: e.target.value })} readOnly className="mt-1 bg-slate-50" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Nota de estado</label>
                <input value={perfil.nota} onChange={e => setPerfil({ ...perfil, nota: e.target.value })} placeholder="En ruta a Osorno" className="mt-1" />
              </div>
              <button onClick={guardar} className="w-full sm:w-auto bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl shadow-sm transition">Guardar perfil</button>
            </div>
            <div className="mt-6">
              <div className="flex justify-between text-xs text-slate-600 mb-1"><span>Órdenes completadas</span><span className="font-bold">{hechas} de {ordenes.length}</span></div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-sky-500 transition-all" style={{ width: ordenes.length ? (hechas / ordenes.length * 100) + '%' : '0%' }} /></div>
            </div>
          </div>
        )}

        {tab === 'ord' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              {ordenes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-500 text-sm">No tienes órdenes asignadas.</div>
              ) : ordenes.map(o => (
                <button key={o.id} onClick={() => setSelectedId(o.id)} className={`w-full text-left bg-white rounded-2xl border p-4 transition ${selected?.id === o.id ? 'border-sky-500 shadow-md' : 'border-slate-200/80 hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-slate-900">{o.id}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${o.urgencia === 'Urgente' ? 'bg-red-100 text-red-700' : o.urgencia === 'Alta' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{o.urgencia}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{o.cliente_nombre}</div>
                  <div className="text-xs text-slate-500 mt-1">{o.falla}</div>
                  <div className="mt-2"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${o.estado === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' : o.estado === 'En proceso' ? 'bg-sky-100 text-sky-700' : 'bg-blue-100 text-blue-700'}`}>{o.estado}</span></div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-7">
              {selected ? (
                <OrdenDetalle o={selected} flash={flash} cambiar={cambiar} off={off} catalogo={catalogo} />
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-slate-500 text-sm">Selecciona una orden para ver el detalle.</div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold z-50">{toast}</div>}
    </div>
  )
}

function OrdenDetalle({ o, flash, cambiar, off, catalogo = [] }) {
  const [rep, setRep] = useState(o.repuestos || o.rep || {})
  const [obs, setObs] = useState(o.observacion || o.obs || '')
  const cv = useRef(null)
  const isDrawingRef = useRef(false)
  const hasSignedRef = useRef(false)
  const [firmado, setFirmado] = useState(Boolean(o.firma))

  // El bitmap debe coincidir con el tamaño CSS y con el DPR del dispositivo;
  // si no, las coordenadas del dedo/cursor no caen sobre el trazo dibujado.
  useEffect(() => {
    const canvas = cv.current
    if (!canvas) return

    const sincronizar = () => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      const dpr = window.devicePixelRatio || 1
      const ancho = Math.round(rect.width * dpr)
      const alto = Math.round(rect.height * dpr)
      if (canvas.width === ancho && canvas.height === alto) return

      let previo = null
      if (hasSignedRef.current && canvas.width && canvas.height) {
        previo = document.createElement('canvas')
        previo.width = canvas.width
        previo.height = canvas.height
        previo.getContext('2d').drawImage(canvas, 0, 0)
      }

      canvas.width = ancho
      canvas.height = alto
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      if (previo) ctx.drawImage(previo, 0, 0, previo.width, previo.height, 0, 0, rect.width, rect.height)
    }

    sincronizar()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sincronizar) : null
    if (ro) ro.observe(canvas)
    window.addEventListener('resize', sincronizar)
    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener('resize', sincronizar)
    }
  }, [])

  // Al cambiar de orden, se descarta la firma de la orden anterior.
  useEffect(() => {
    isDrawingRef.current = false
    hasSignedRef.current = false
    setRep(o.repuestos || o.rep || {})
    setObs(o.observacion || o.obs || '')
    setFirmado(Boolean(o.firma))
    const canvas = cv.current
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
  }, [o.id])

  const pos = e => {
    const r = cv.current.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const alIniciar = e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const canvas = cv.current
    if (!canvas) return
    e.preventDefault()
    try { if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId) } catch { /* puntero ya liberado */ }
    isDrawingRef.current = true
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#0f172a'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(...pos(e))
  }

  const alMover = e => {
    if (!isDrawingRef.current || !cv.current) return
    e.preventDefault()
    const ctx = cv.current.getContext('2d')
    ctx.lineTo(...pos(e))
    ctx.stroke()
    if (!hasSignedRef.current) {
      hasSignedRef.current = true
      setFirmado(true) // un solo re-render por trazo: React no borra el buffer
    }
  }

  const alTerminar = e => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    try {
      if (e.currentTarget.hasPointerCapture && e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
    } catch { /* el puntero ya se liberó */ }
    if (cv.current) cv.current.getContext('2d').closePath()
  }

  const limpiar = () => {
    const canvas = cv.current
    if (!canvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    isDrawingRef.current = false
    hasSignedRef.current = false
    setFirmado(false)
  }

  const set = (k, d) => setRep(r => ({ ...r, [k]: Math.max(0, (r[k] || 0) + d) }))
  const elegir = async e => {
    if (e === 'Finalizado' && !obs.trim()) return flash('La observación es obligatoria para finalizar')
    const cambio = { estado: e, repuestos: rep, observacion: obs }
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random())
    await cambiar(o.id, cambio, `${o.id} → ${e}`, uuid)
    if (hasSignedRef.current && !off && cv.current) {
      cv.current.toBlob(async blob => {
        if (blob) { try { await subirAdjunto(o.id, blob, 'firma') } catch (err) { flash('Error al subir firma: ' + err.message) } }
      }, 'image/png')
    }
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <b className="font-mono text-xl text-slate-900">{o.id}</b>
          <div className="text-sm text-slate-500">{o.cliente_nombre} · {o.falla}</div>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${o.urgencia === 'Urgente' ? 'bg-red-100 text-red-700' : o.urgencia === 'Alta' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{o.urgencia}</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[['Asignada', 'Inicio', Play], ['En proceso', 'En proceso', Loader], ['Finalizado', 'Finalizado', CheckCircle2]].map(([e, l, Ic]) => (
          <button key={e} onClick={() => elegir(e)} className={`h-16 rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition ${o.estado === e ? 'bg-sky-600 text-white shadow-md' : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-sky-400'}`}>
            <Ic size={20} /> {l}
          </button>
        ))}
      </div>

      {Array.isArray(o.materiales_presupuestados) && o.materiales_presupuestados.length > 0 && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-3">
          <b className="text-sm text-sky-900 flex items-center gap-1"><ClipboardList size={14} /> Materiales sugeridos por presupuesto</b>
          <div className="mt-2 space-y-1.5">
            {o.materiales_presupuestados.map((m, i) => {
              const sugerido = Number(m.cantidad || 0)
              const usado = Number(rep[m.nombre] || 0)
              return (
                <div key={`${m.nombre || 'material'}-${i}`} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-700 font-medium">{m.nombre}{m.unidad ? ` · ${m.unidad}` : ''}</span>
                  <span className="inline-flex items-center gap-2 text-slate-500">
                    Sugerido: <b className="text-slate-800">{sugerido}</b>
                    <span className="text-slate-300">|</span>
                    Usado: <b className="text-slate-800">{usado}</b>
                    {usado > sugerido && <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">Consumo adicional</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <b className="text-sm text-slate-900 flex items-center gap-1"><Wrench size={14} /> Repuestos utilizados</b>
        <div className="mt-2 space-y-2">
          {catalogo.length === 0 ? <p className="text-xs text-slate-500">Sin catálogo disponible. Se usarán los repuestos básicos.</p> : catalogo.map(r => (
            <div key={r.id || r.nombre} className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700">
                {r.nombre}
                {r.unidad && <span className="text-xs text-slate-400"> · {r.unidad}</span>}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => set(r.nombre, -1)} className="w-12 h-12 rounded-xl bg-slate-200 font-bold text-xl flex items-center justify-center">−</button>
                <b className="w-8 text-center text-lg">{rep[r.nombre] || 0}</b>
                <button onClick={() => set(r.nombre, 1)} className="w-12 h-12 rounded-xl bg-slate-200 font-bold text-xl flex items-center justify-center">+</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-slate-700">Observación (obligatoria)</label>
        <textarea rows={3} value={obs} onChange={e => setObs(e.target.value)} className="mt-1" />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-sm font-semibold text-slate-700">Firma del cliente</label>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${firmado ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            {firmado ? 'Firma capturada' : 'Sin firma'}
          </span>
        </div>
        <canvas
          ref={cv}
          onPointerDown={alIniciar}
          onPointerMove={alMover}
          onPointerUp={alTerminar}
          onPointerLeave={alTerminar}
          onPointerCancel={alTerminar}
          className="mt-1 w-full h-40 touch-none select-none cursor-crosshair bg-white border-2 border-dashed border-slate-300 rounded-xl"
        />
        <button onClick={limpiar} className="mt-2 text-xs font-semibold text-slate-500 hover:text-sky-600">Limpiar firma</button>
      </div>
    </div>
  )
}