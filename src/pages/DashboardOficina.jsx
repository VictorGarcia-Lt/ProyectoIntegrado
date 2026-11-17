import { useState, useEffect } from 'react'
import { ClipboardList, Users, FileText, BarChart3, ShieldCheck, LogOut, AlertTriangle, Wrench, UserCheck, Bell, Plus, Search, Globe, Phone, MessageCircle, Radio, Truck, Snowflake, X, Building2, Activity, Clock } from 'lucide-react'
import { getSolicitudes, crearSolicitud, asignarTecnico, getClientes, getHistorialCliente, getTecnicos, cambiarDisponibilidad } from '../services/operacionesService'
import { getCotizaciones, cambiarEstadoCotizacion } from '../services/gestionService'
import { getResumenReportes, getAuditoria } from '../services/gestionService'
import logoJGFrio from '../img/logo-jgfrio.png'

const OR = { Web: Globe, Teléfono: Phone, WhatsApp: MessageCircle, SITRAD: Radio }
const ORD = { Urgente: 0, Alta: 1, Normal: 2 }

const titulos = { sol: 'Solicitudes de Servicio', cli: 'Clientes e Instalaciones', tec: 'Flota de Técnicos', cot: 'Cotizaciones', rep: 'Reportes y KPIs', aud: 'Auditoría del Sistema' }

export default function DashboardOficina({ user, logout }) {
  const [tab, setTab] = useState('sol')
  const [fl, setFl] = useState({ estado: '', zona: '', urg: '', q: '' })
  const [sols, setSols] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [clientes, setClientes] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [reportes, setReportes] = useState(null)
  const [auditoria, setAuditoria] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [wiz, setWiz] = useState(0)
  const [asig, setAsig] = useState(null)
  const [sel, setSel] = useState(null)
  const [ficha, setFicha] = useState(null)
  const [histFicha, setHistFicha] = useState([])
  const [nueva, setNueva] = useState({ cli: 1, origen: 'Teléfono', urg: 'Normal', falla: '' })

  const puedeAsignar = user.rol !== 'ventas'
  const puedeEditarCot = user.rol === 'ventas' || user.rol === 'admin'

  const cn = id => clientes.find(c => c.id === id)

  const menu = [
    ['sol', 'Solicitudes', ClipboardList],
    ['cli', 'Clientes', Users],
    ['tec', 'Técnicos', Truck],
    ['cot', 'Cotizaciones', FileText],
    ['rep', 'Reportes', BarChart3],
    ...(user.rol !== 'ventas' ? [['aud', 'Auditoría', ShieldCheck]] : []),
  ]

  const loadSols = async () => { setLoading(true); setErr(''); try { setSols(await getSolicitudes(fl)) } catch (e) { setErr(e.message) } finally { setLoading(false) } }
  const loadTecnicos = async () => { try { setTecnicos(await getTecnicos()) } catch (e) { setErr(e.message) } }
  const loadClientes = async () => { try { setClientes(await getClientes()) } catch (e) { setErr(e.message) } }
  const loadCotizaciones = async () => { try { setCotizaciones(await getCotizaciones()) } catch (e) { setErr(e.message) } }
  const loadReportes = async () => { try { setReportes(await getResumenReportes()) } catch (e) { setErr(e.message) } }
  const loadAuditoria = async () => { try { setAuditoria(await getAuditoria()) } catch (e) { setErr(e.message) } }

  useEffect(() => { loadTecnicos(); loadClientes() }, [])
  useEffect(() => { if (tab === 'sol') loadSols() }, [tab, fl.estado, fl.zona, fl.urg, fl.q])
  useEffect(() => { if (tab === 'cli') loadClientes() }, [tab])
  useEffect(() => { if (tab === 'tec') loadTecnicos() }, [tab])
  useEffect(() => { if (tab === 'cot') loadCotizaciones() }, [tab])
  useEffect(() => { if (tab === 'rep') loadReportes() }, [tab])
  useEffect(() => { if (tab === 'aud') loadAuditoria() }, [tab])

  const crear = async () => {
    try { await crearSolicitud({ cli: +nueva.cli, origen: nueva.origen, urg: nueva.urg, falla: nueva.falla }); await loadSols(); setWiz(0); setNueva({ cli: 1, origen: 'Teléfono', urg: 'Normal', falla: '' }) }
    catch (e) { setErr(e.message) }
  }
  const asignar = async () => {
    if (!sel) return
    try { await asignarTecnico(asig.id, sel); await loadSols(); setAsig(null); setSel(null) } catch (e) { setErr(e.message) }
  }
  const abrirFicha = async c => {
    setFicha(c)
    try { const data = await getHistorialCliente(c.id); setHistFicha(data.historial || []) } catch { setHistFicha([]) }
  }
  const toggleTecDisponible = async tec => {
    try { await cambiarDisponibilidad(tec.id, !tec.disponible, tec.nota); await loadTecnicos() } catch (e) { setErr(e.message) }
  }
  const cambiarEstadoCot = async (id, estado) => {
    try { await cambiarEstadoCotizacion(id, estado); await loadCotizaciones() } catch (e) { setErr(e.message) }
  }

  const lista = (sols || []).slice().sort((a, b) => ORD[a.urgencia || a.urg] - ORD[b.urgencia || b.urg])
  const kpiUrgentes = sols.filter(s => (s.urgencia || s.urg) === 'Urgente' && s.estado !== 'Finalizado').length
  const kpiEnProceso = sols.filter(s => s.estado === 'En proceso').length
  const kpiTecDisp = tecnicos.filter(t => t.disponible).length
  const kpiAlertas = clientes.filter(c => c.alerta_preventiva).length

  const badgeEstado = e => {
    const map = { Urgente: 'bg-red-100 text-red-700', Alta: 'bg-amber-100 text-amber-800', Normal: 'bg-slate-100 text-slate-600', Pendiente: 'bg-slate-100 text-slate-600', Asignada: 'bg-blue-100 text-blue-700', 'En proceso': 'bg-sky-100 text-sky-700', Finalizado: 'bg-emerald-100 text-emerald-700', Nueva: 'bg-blue-100 text-blue-700', 'En revisión': 'bg-amber-100 text-amber-800', Enviada: 'bg-indigo-100 text-indigo-700', Aceptada: 'bg-emerald-100 text-emerald-700', Rechazada: 'bg-red-100 text-red-700' }
    return map[e] || 'bg-slate-100 text-slate-600'
  }

  const cotEstadoLabel = e => ({ Nueva: 'Nueva', 'En revisión': 'En revisión', Enviada: 'Enviada', Aceptada: 'Aceptada', Rechazada: 'Rechazada' }[e] || e)

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <aside className="hidden lg:flex w-64 bg-slate-950 text-slate-200 flex-col p-4 sticky top-0 h-screen border-r border-slate-800/80">
        <div className="border-b border-slate-800/80 pb-4 mb-4 px-2">
          <img src={logoJGFrio} alt="JG Frío & Agroindustria" className="h-14 w-auto object-contain scale-110 origin-left" />
        </div>
        <nav className="flex-1 space-y-1">
          {menu.map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${tab === k ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/20' : 'text-slate-300 hover:bg-slate-900 hover:text-white'}`}>
              <I className="w-4 h-4" /> {l}
            </button>
          ))}
        </nav>
        <div className="bg-slate-900/60 rounded-xl p-3 mt-4 border border-slate-800">
          <div className="text-sm font-bold text-white">{user.nombre}</div>
          <div className="text-xs text-slate-400 capitalize mb-3">{user.rol}</div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition">
            <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between">
          <img src={logoJGFrio} alt="JG Frío" className="h-8 w-auto object-contain" />
          <button onClick={logout} className="text-slate-300"><LogOut size={18} /></button>
        </header>
        <nav className="lg:hidden bg-slate-950 px-2 pb-2 flex gap-1 overflow-x-auto">
          {menu.map(([k, l, I]) => (
            <button key={k} onClick={() => setTab(k)} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${tab === k ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white' : 'text-slate-300'}`}>
              <I className="w-3.5 h-3.5" /> {l}
            </button>
          ))}
        </nav>

        <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-8 py-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{titulos[tab]}</h1>
            <p className="text-xs text-slate-500">Panel operativo · JG Frío</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />En línea · Supabase</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold capitalize">{user.rol}</span>
          </div>
        </div>

        <main className="p-4 md:p-8 flex-1">
          {err && <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">{err}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Urgentes</p><p className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">{kpiUrgentes}</p></div><div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-50 text-red-600 border border-red-100"><AlertTriangle className="w-5 h-5" /></div></div>
              <p className="text-xs text-slate-500 mt-2">Requieren atención inmediata</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">En curso</p><p className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">{kpiEnProceso}</p></div><div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100"><Wrench className="w-5 h-5" /></div></div>
              <p className="text-xs text-slate-500 mt-2">Técnicos en terreno</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Disponibles</p><p className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">{kpiTecDisp}</p></div><div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100"><UserCheck className="w-5 h-5" /></div></div>
              <p className="text-xs text-slate-500 mt-2">Pueden recibir órdenes</p>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start"><div><p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Alertas</p><p className="text-3xl font-extrabold tracking-tight text-slate-900 mt-1">{kpiAlertas}</p></div><div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 border border-amber-100"><Bell className="w-5 h-5" /></div></div>
              <p className="text-xs text-slate-500 mt-2">≥3 fallas de compresor</p>
            </div>
          </div>

          {tab === 'sol' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold text-slate-900">Solicitudes</h3>
                <button onClick={() => setWiz(1)} className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg text-sm shadow-sm transition"><Plus size={16} /> Nueva solicitud</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <div className="relative"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input placeholder="Buscar..." value={fl.q} onChange={e => setFl({ ...fl, q: e.target.value })} className="pl-10 h-10 text-sm rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none" /></div>
                <select value={fl.estado} onChange={e => setFl({ ...fl, estado: e.target.value })} className="h-10 text-sm rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none"><option value="">Estado</option>{['Pendiente', 'Asignada', 'En proceso', 'Finalizado'].map(x => <option key={x}>{x}</option>)}</select>
                <select value={fl.zona} onChange={e => setFl({ ...fl, zona: e.target.value })} className="h-10 text-sm rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none"><option value="">Zona</option>{['Los Lagos', 'Maule', 'Ñuble'].map(x => <option key={x}>{x}</option>)}</select>
                <select value={fl.urg} onChange={e => setFl({ ...fl, urg: e.target.value })} className="h-10 text-sm rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none"><option value="">Urgencia</option>{['Urgente', 'Alta', 'Normal'].map(x => <option key={x}>{x}</option>)}</select>
              </div>
              {loading && <p className="text-slate-500 text-sm mb-3">Cargando...</p>}
              <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr><th className="px-4 py-3.5">Código</th><th className="px-4 py-3.5">Cliente</th><th className="px-4 py-3.5">Origen</th><th className="px-4 py-3.5">Urgencia</th><th className="px-4 py-3.5">Estado</th><th className="px-4 py-3.5">Técnico</th><th className="px-4 py-3.5 text-right">Acciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {lista.map(s => {
                      const O = OR[s.origen]
                      const t = tecnicos.find(x => x.id === s.tec_id)
                      return (
                        <tr key={s.id} className={`${(s.urgencia || s.urg) === 'Urgente' ? 'bg-red-50/40 border-l-4 border-l-red-500' : ''} hover:bg-slate-50/80 transition`}>
                          <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">{s.id}</td>
                          <td className="px-4 py-3.5"><div className="font-semibold text-slate-900">{s.cliente_nombre || cn(s.cliente_id)?.nombre}</div><div className="text-xs text-slate-500">{s.zona}</div></td>
                          <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1">{O && <O size={14} />} {s.origen}</span></td>
                          <td className="px-4 py-3.5"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(s.urgencia || s.urg)}`}>{s.urgencia || s.urg}</span></td>
                          <td className="px-4 py-3.5"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(s.estado)}`}>{s.estado}</span></td>
                          <td className="px-4 py-3.5">{t ? <span className="inline-flex items-center"><span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 grid place-items-center text-xs font-bold mr-2">{t.nombre.replace(/[^A-ZÁÉÍÓÚ]/g, '').slice(0, 2)}</span>{t.nombre}</span> : '—'}</td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700" onClick={() => abrirFicha(cn(s.cliente_id))}>Ficha</button>
                              {puedeAsignar && s.estado === 'Pendiente' && <button className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm" onClick={() => setAsig(s)}>Asignar</button>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'cli' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {clientes.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 grid place-items-center"><Building2 size={20} /></div>
                        <div>
                          <h3 className="font-bold text-slate-900">{c.nombre}</h3>
                          <p className="text-xs text-slate-500">{c.rubro} · {c.zona}</p>
                        </div>
                      </div>
                      {c.alerta_preventiva && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">Alerta</span>}
                    </div>
                    {c.alerta_preventiva && <div className="bg-amber-50 border border-amber-200/90 text-amber-900 rounded-xl p-3 text-xs flex items-start gap-2.5 mb-3"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> Mantención preventiva: fallas recurrentes de compresor detectadas.</div>}
                  </div>
                  <button onClick={() => abrirFicha(c)} className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 hover:bg-sky-600 text-white text-xs font-semibold transition">Ver ficha e historial →</button>
                </div>
              ))}
            </div>
          )}

          {tab === 'tec' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {tecnicos.map(t => (
                <div key={t.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition overflow-hidden">
                  <div className={`h-1.5 ${t.disponible ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white font-bold flex items-center justify-center">{t.nombre.replace(/[^A-ZÁÉÍÓÚ]/g, '').slice(0, 2)}</div>
                      <div>
                        <h3 className="font-bold text-slate-900">{t.nombre}</h3>
                        <p className="text-xs text-slate-500">{t.especialidad}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{t.zona}</p>
                    <p className="text-xs text-slate-500 italic mb-3">“{t.nota}”</p>
                    <div className="flex items-center justify-between mb-3 text-sm">
                      <span className="text-slate-500">Órdenes activas</span>
                      <span className="font-bold text-slate-900">{t.ordenes_activas ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${t.disponible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${t.disponible ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} /> {t.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    {(user.rol === 'encargado' || user.rol === 'admin') && (
                      <button onClick={() => toggleTecDisponible(t)} className="w-full text-sm font-semibold border border-slate-200 hover:border-sky-400 hover:bg-sky-50 rounded-lg py-2 transition">
                        {t.disponible ? 'Marcar no disponible' : 'Marcar disponible'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'cot' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Cotizaciones</h3>
              {cotizaciones.length === 0 ? <p className="text-slate-500">Aún no hay cotizaciones.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr><th className="px-4 py-3.5">ID</th><th className="px-4 py-3.5">Empresa</th><th className="px-4 py-3.5">Rubro</th><th className="px-4 py-3.5">Correo</th><th className="px-4 py-3.5">Estado</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {cotizaciones.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">{c.id}</td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">{c.empresa}</td>
                          <td className="px-4 py-3.5 text-slate-600">{c.rubro}</td>
                          <td className="px-4 py-3.5 text-slate-500">{c.correo}</td>
                          <td className="px-4 py-3.5">
                            {puedeEditarCot ? (
                              <select value={c.estado} onChange={e => cambiarEstadoCot(c.id, e.target.value)} className="h-9 rounded-lg border border-slate-200 text-xs font-semibold px-2 bg-white focus:border-sky-500 focus:outline-none">
                                {['Nueva', 'En revisión', 'Enviada', 'Aceptada', 'Rechazada'].map(x => <option key={x}>{x}</option>)}
                              </select>
                            ) : <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(c.estado)}`}>{cotEstadoLabel(c.estado)}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'rep' && (
            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Solicitudes por estado</h3>
                  <div className="space-y-3">
                    {(reportes?.por_estado || []).map(p => {
                      const total = reportes.por_estado.reduce((a, b) => a + b.total, 0) || 1
                      const pct = Math.round((p.total / total) * 100)
                      return (
                        <div key={p.estado}>
                          <div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700">{p.estado}</span><span className="font-bold text-slate-900">{p.total} · {pct}%</span></div>
                          <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-sky-500 transition-all" style={{ width: pct + '%' }} /></div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Resumen operativo</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-red-50 rounded-xl p-3"><span className="text-sm font-medium text-red-700">Urgentes activas</span><span className="text-2xl font-extrabold text-red-700">{reportes?.urgentes_activas ?? 0}</span></div>
                    <div className="flex justify-between items-center bg-emerald-50 rounded-xl p-3"><span className="text-sm font-medium text-emerald-700">Técnicos disponibles</span><span className="text-2xl font-extrabold text-emerald-700">{reportes?.tecnicos_disponibles ?? 0}</span></div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Carga por técnico (órdenes finalizadas)</h3>
                <div className="space-y-3">
                  {(reportes?.por_tecnico || []).map(p => {
                    const max = Math.max(...(reportes?.por_tecnico || []).map(x => x.finalizadas), 1)
                    const pct = Math.round((p.finalizadas / max) * 100)
                    return (
                      <div key={p.id}>
                        <div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700">{p.nombre}</span><span className="font-bold text-slate-900">{p.finalizadas}</span></div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: pct + '%' }} /></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'aud' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Registro de auditoría</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr><th className="px-4 py-3.5">Fecha</th><th className="px-4 py-3.5">Usuario</th><th className="px-4 py-3.5">Acción</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {auditoria.map((a, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">{a.fecha || a.t}</td>
                        <td className="px-4 py-3.5 text-slate-700">{a.usuario || a.u}</td>
                        <td className="px-4 py-3.5 text-slate-900">{a.accion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {wiz > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-400" />
            <div className="p-6 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Nueva solicitud</h3>
                <button onClick={() => setWiz(0)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3].map(n => <span key={n} className={`w-8 h-8 rounded-full grid place-items-center text-sm font-bold ${wiz >= n ? 'bg-sky-500 text-slate-950' : 'bg-slate-200 text-slate-500'}`}>{n}</span>)}
              </div>
              {wiz === 1 && <>
                <label className="text-sm font-semibold text-slate-700">Cliente</label>
                <select value={nueva.cli} onChange={e => setNueva({ ...nueva, cli: e.target.value })} className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none">{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select>
                <label className="text-sm font-semibold text-slate-700 mt-3 block">Canal</label>
                <select value={nueva.origen} onChange={e => setNueva({ ...nueva, origen: e.target.value })} className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none">{Object.keys(OR).map(o => <option key={o}>{o}</option>)}</select>
              </>}
              {wiz === 2 && <>
                <label className="text-sm font-semibold text-slate-700">Urgencia</label>
                <select value={nueva.urg} onChange={e => setNueva({ ...nueva, urg: e.target.value })} className="mt-1 w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none">{['Urgente', 'Alta', 'Normal'].map(o => <option key={o}>{o}</option>)}</select>
                <label className="text-sm font-semibold text-slate-700 mt-3 block">Falla</label>
                <textarea rows={3} value={nueva.falla} onChange={e => setNueva({ ...nueva, falla: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-700 focus:bg-white focus:border-sky-500 focus:outline-none" />
              </>}
              {wiz === 3 && <>
                <h3 className="text-lg font-bold mb-2">Confirmación</h3>
                <p className="text-slate-700">{cn(+nueva.cli)?.nombre} · {nueva.origen} · <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${badgeEstado(nueva.urg)}`}>{nueva.urg}</span></p>
                <p className="text-slate-500 text-sm mt-2">{nueva.falla || 'Sin descripción'}</p>
              </>}
              <div className="flex justify-between mt-6">
                <button onClick={() => setWiz(wiz === 1 ? 0 : wiz - 1)} className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-sm">{wiz === 1 ? 'Cancelar' : 'Atrás'}</button>
                {wiz < 3 ? <button disabled={wiz === 2 && nueva.falla.length < 5} onClick={() => setWiz(wiz + 1)} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-sm disabled:opacity-50">Siguiente</button>
                  : <button onClick={crear} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-sm">Crear solicitud</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {asig && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-400" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-slate-900">Asignar técnico · {asig.id}</h3>
                <button onClick={() => setAsig(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>
              <div className="space-y-2">
                {[...tecnicos].sort((a, b) => (b.zona === asig.zona) - (a.zona === asig.zona)).map(t => (
                  <div key={t.id} onClick={() => { if (t.disponible) setSel(t.id) }} className={`border-2 rounded-xl p-3 transition ${t.disponible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50 bg-slate-50'} ${sel === t.id ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="flex items-center justify-between">
                      <b className="text-slate-900">{t.nombre} { !t.disponible && <span className="text-xs text-slate-400 font-normal">— No disponible (Ocupado)</span>}</b>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${t.disponible ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{t.disponible ? 'Disponible' : 'No disponible'}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{t.zona} · {t.especialidad} · “{t.nota}”</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setAsig(null)} className="px-4 py-2 rounded-lg border border-slate-200 font-semibold text-sm">Cancelar</button>
                <button disabled={!sel} onClick={asignar} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-bold text-sm shadow-sm disabled:opacity-50">Asignar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ficha && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setFicha(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-cyan-400" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">{ficha.nombre}</h3>
                <button onClick={() => setFicha(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>
              <p className="text-sm text-slate-500 mb-3">{ficha.instalaciones?.map(i => i.equipo).join(', ') || ficha.equipo} · {ficha.zona}</p>
              {ficha.alerta_preventiva && <div className="mb-3 bg-amber-50 border border-amber-200/90 text-amber-900 rounded-xl p-3 text-xs flex items-start gap-2.5"><AlertTriangle size={14} className="mt-0.5 shrink-0" /> Mantención preventiva</div>}
              <h4 className="text-sm font-bold text-slate-700 mb-2">Historial</h4>
              <div className="space-y-3">
                {histFicha.map((h, i) => (
                  <div key={i} className="border-l-4 border-sky-500 pl-3 py-1">
                    <div className="text-xs font-mono text-slate-500">{h.fecha}</div>
                    <div className="text-sm text-slate-700">{h.descripcion || h.desc}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setFicha(null)} className="mt-4 px-4 py-2 rounded-lg border border-slate-200 font-semibold text-sm">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}