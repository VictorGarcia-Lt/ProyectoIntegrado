import { useState, useRef, useEffect } from 'react'
import { LogOut, Play, Loader, CheckCircle2, Wrench, Wifi, WifiOff } from 'lucide-react'
import { getMisOrdenes, actualizarOrden, subirAdjunto, sincronizarColaOffline } from '../services/terrenoService'
import { getTecnicos, cambiarDisponibilidad } from '../services/operacionesService'

export default function VistaTecnico({ user, logout }) {
  const [tab, setTab] = useState('ord')
  const [off, setOff] = useState(false)
  const [toast, setToast] = useState('')
  const [ordenes, setOrdenes] = useState([])
  const [tecnicos, setTecnicos] = useState([])
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
                <OrdenDetalle o={selected} flash={flash} cambiar={cambiar} off={off} />
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

function OrdenDetalle({ o, flash, cambiar, off }) {
  const [rep, setRep] = useState(o.repuestos || o.rep || {})
  const [obs, setObs] = useState(o.observacion || o.obs || '')
  const cv = useRef()
  const draw = useRef(false)
  const [firmado, setFirmado] = useState(o.firma || false)

  useEffect(() => { const c = cv.current; if (c) { c.width = c.offsetWidth || 400; c.height = 160 } }, [])

  const pos = e => { const r = cv.current.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
  const down = e => { draw.current = true; const x = cv.current.getContext('2d'); x.beginPath(); x.moveTo(...pos(e)) }
  const move = e => { if (!draw.current) return; const x = cv.current.getContext('2d'); x.lineWidth = 2.5; x.lineTo(...pos(e)); x.stroke(); setFirmado(true) }
  const limpiar = () => { cv.current.getContext('2d').clearRect(0, 0, 9999, 9999); setFirmado(false) }
  const set = (k, d) => setRep(r => ({ ...r, [k]: Math.max(0, (r[k] || 0) + d) }))
  const elegir = async e => {
    if (e === 'Finalizado' && !obs.trim()) return flash('La observación es obligatoria para finalizar')
    const cambio = { estado: e, repuestos: rep, observacion: obs }
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.random())
    await cambiar(o.id, cambio, `${o.id} → ${e}`, uuid)
    if (firmado && !off && cv.current) {
      cv.current.toBlob(async blob => {
        if (blob) { try { await subirAdjunto(o.id, blob, 'firma') } catch (err) { flash('Error al subir firma: ' + err.message) } }
      }, 'image/png')
    }
  }
  const repuestosList = ['Compresor 3HP', 'Gas refrigerante R404A', 'Controlador digital']

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

      <div>
        <b className="text-sm text-slate-900 flex items-center gap-1"><Wrench size={14} /> Repuestos</b>
        <div className="mt-2 space-y-2">
          {repuestosList.map(r => (
            <div key={r} className="flex items-center justify-between">
              <span className="text-sm text-slate-700">{r}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => set(r, -1)} className="w-12 h-12 rounded-xl bg-slate-200 font-bold text-xl flex items-center justify-center">−</button>
                <b className="w-8 text-center text-lg">{rep[r] || 0}</b>
                <button onClick={() => set(r, 1)} className="w-12 h-12 rounded-xl bg-slate-200 font-bold text-xl flex items-center justify-center">+</button>
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
        <label className="text-sm font-semibold text-slate-700">Firma del cliente</label>
        <canvas ref={cv} className="mt-1 w-full h-40 border-2 border-dashed border-slate-300 rounded-xl bg-white" />
        <button onClick={limpiar} className="mt-2 text-xs font-semibold text-slate-500 hover:text-sky-600">Limpiar firma</button>
      </div>
    </div>
  )
}