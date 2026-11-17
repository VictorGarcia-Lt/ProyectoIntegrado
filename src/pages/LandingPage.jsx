import { useState, useEffect } from 'react'
import {
  Snowflake, Activity, ShieldCheck, Clock, ClipboardList, UserCheck, FileCheck,
  Milk, Fish, Wheat, Beef, Send, Lock, ThermometerSnowflake, Building2,
  Factory, Waves, Mail, CheckCircle2, ArrowRight, Zap, Radio,
} from 'lucide-react'
import { enviarCotizacionPublica } from '../services/gestionService'
import logoJGFrio from '../img/logo-jgfrio.png'

export default function LandingPage({ onLogin }) {
  const [f, setF] = useState({ empresa: '', correo: '', rubro: 'Lácteo', desc: '', acepta: false })
  const [err, setErr] = useState({})
  const [cod, setCod] = useState(null)
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')
  const textoAnimado = 'cadena de frío industrial.'
  const [textoVisible, setTextoVisible] = useState('')
  useEffect(() => {
    let i = 0
    let interval
    const start = () => {
      interval = setInterval(() => {
        i += 1
        setTextoVisible(textoAnimado.slice(0, i))
        if (i >= textoAnimado.length) {
          clearInterval(interval)
          setTimeout(() => { setTextoVisible(''); i = 0; start() }, 4000)
        }
      }, 75)
    }
    start()
    return () => clearInterval(interval)
  }, [])
  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const enviar = async e => {
    e.preventDefault()
    const er = {}
    if (f.empresa.trim().length < 3) er.empresa = 'Ingresa empresa y contacto'
    if (!/^\S+@\S+\.\S+$/.test(f.correo)) er.correo = 'Correo no válido'
    if (f.desc.trim().length < 10) er.desc = 'Describe el problema (mín. 10 caracteres)'
    if (!f.acepta) er.acepta = 'Debes aceptar el tratamiento de datos (Ley 19.628)'
    setErr(er)
    if (Object.keys(er).length) return
    setLoading(true); setServerErr('')
    try {
      const data = await enviarCotizacionPublica({ empresa: f.empresa, correo: f.correo, rubro: f.rubro, desc: f.desc, acepta: f.acepta })
      setCod(data.codigo)
    } catch (e) { setServerErr(e.message) } finally { setLoading(false) }
  }
  const E = k => err[k] && <small className="text-red-600 text-xs mt-1 block">{err[k]}</small>

  const sectores = [
    { icon: <Wheat size={20} />, t: 'Agroindustria & Fruta' },
    { icon: <Beef size={20} />, t: 'Industria Cárnica' },
    { icon: <Fish size={20} />, t: 'Sector Pesquero' },
    { icon: <Milk size={20} />, t: 'Plantas Lácteas' },
  ]

  const servicios = [
    { icon: <Activity size={26} />, t: 'Mantenimiento Correctivo 24/7', d: 'Atención prioritaria ante caídas de temperatura para evitar mermas de producción.' },
    { icon: <Building2 size={26} />, t: 'Proyectos y Montaje Frigorífico', d: 'Diseño e instalación de cámaras de frío, túneles de congelado y centrales de compresores.' },
    { icon: <ThermometerSnowflake size={26} />, t: 'Telemetría y Control SITRAD', d: 'Implementación de monitoreo remoto de temperatura y humedad con alertas tempranas.' },
  ]

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* 1. Navbar flotante glassmorphism */}
      <nav className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-6">
          <img src={logoJGFrio} alt="JG Frío & Agroindustria" className="h-12 sm:h-14 w-auto object-contain scale-125 origin-left" />
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-300">
            <a href="#servicios" onClick={e => { e.preventDefault(); go('servicios') }} className="hover:text-white transition">Servicios</a>
            <a href="#sectores" onClick={e => { e.preventDefault(); go('sectores') }} className="hover:text-white transition">Sectores</a>
            <a href="#tecnologia" onClick={e => { e.preventDefault(); go('tecnologia') }} className="hover:text-white transition">Tecnología</a>
            <a href="#cotizar" onClick={e => { e.preventDefault(); go('cotizar') }} className="hover:text-white transition">Cotizar</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => go('cotizar')} className="hidden sm:inline-flex text-sm font-semibold text-slate-200 hover:text-white transition">Cotizar Proyecto</button>
            <button onClick={onLogin} className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold px-4 py-2 rounded-lg transition">
              <Lock size={16} /> Acceso Personal
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero asimétrico */}
      <header className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        <div className="relative max-w-7xl mx-auto px-6 pt-12 pb-24 lg:pt-16 lg:pb-24 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> Monitoreo Remoto SITRAD & Soporte 24/7 en Terreno
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-6 min-h-[3.6em] sm:min-h-[2.4em]">
              Protegemos la continuidad de tu{' '}
              <span className="text-sky-400">
                {textoVisible}
                <span className="inline-block w-[3px] h-[0.9em] bg-sky-400 ml-1 align-middle animate-pulse" />
              </span>
            </h1>
            <p className="text-slate-300 text-lg mb-8 max-w-xl">
              Instalación, mantenimiento preventivo y respuesta de emergencia para plantas agroindustriales, cárnicas, pesqueras y lácteas en todo Chile.
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => go('cotizar')} className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-6 py-4 rounded-xl shadow-lg shadow-sky-500/20 transition">
                Solicitar Cotización Técnica <ArrowRight size={18} />
              </button>
              <button onClick={() => go('servicios')} className="inline-flex items-center gap-2 border border-slate-700 hover:border-slate-500 text-white px-6 py-4 rounded-xl transition">
                Conocer Servicios
              </button>
            </div>
          </div>

          {/* Tarjeta visual de telemetría con glow */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/25 to-blue-600/25 rounded-2xl blur-xl" />
            <div className="relative bg-slate-900/90 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ThermometerSnowflake size={18} className="text-cyan-400" />
                  <span className="font-bold text-white">Panel de Telemetría SITRAD</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  En vivo
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { n: 'Cámara Maduración', v: '-2.4 °C', s: 'Óptimo', c: 'text-emerald-400', bar: 'bg-emerald-400', w: '88%' },
                  { n: 'Túnel Congelado', v: '-24.8 °C', s: 'Óptimo', c: 'text-emerald-400', bar: 'bg-emerald-400', w: '92%' },
                  { n: 'Sala de Proceso', v: '+4.1 °C', s: 'Controlado', c: 'text-sky-400', bar: 'bg-sky-400', w: '74%' },
                ].map(r => (
                  <div key={r.n} className="bg-slate-800/60 border border-slate-700/50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Activity size={16} className="text-cyan-400" />
                        <span className="text-sm text-slate-200">{r.n}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-white">{r.v}</span>
                        <span className={`text-xs font-bold ${r.c}`}>{r.s}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${r.bar} rounded-full`} style={{ width: r.w }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-slate-400">Respuesta Emergencia</span>
                <span className="font-bold text-white">&lt; 2 hrs en planta</span>
              </div>
              <div className="mt-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <ShieldCheck size={14} /> Sistema conectado · Trazabilidad 100% digital
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Franja de sectores (flotante, puente visual) */}
      <section id="sectores" className="relative z-10 -mt-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-6">Sectores que atendemos</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sectores.map(s => (
              <div key={s.t} className="flex items-center justify-center gap-3 text-slate-700">
                <div className="w-11 h-11 rounded-full bg-sky-50 text-sky-600 grid place-items-center">{s.icon}</div>
                <span className="font-semibold text-sm">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Banner animado de métricas clave */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
        <div className="marquee-fade bg-slate-900 rounded-2xl py-4 px-6 border border-slate-800 shadow-md overflow-hidden relative">
          <div className="marquee-track">
            {[
              { icon: <Clock size={18} className="text-sky-400" />, v: '24/7', l: 'Respuesta de Emergencia en Terreno', c: 'text-sky-300' },
              { icon: <Zap size={18} className="text-amber-400" />, v: '< 2 hrs', l: 'Tiempo objetivo de atención crítica', c: 'text-amber-200' },
              { icon: <Radio size={18} className="text-emerald-400" />, v: 'SITRAD', l: 'Monitoreo remoto y alertas en tiempo real', c: 'text-emerald-300' },
              { icon: <ShieldCheck size={18} className="text-blue-400" />, v: '100%', l: 'Trazabilidad digital y firma en planta', c: 'text-blue-200' },
            ].concat([
              { icon: <Clock size={18} className="text-sky-400" />, v: '24/7', l: 'Respuesta de Emergencia en Terreno', c: 'text-sky-300' },
              { icon: <Zap size={18} className="text-amber-400" />, v: '< 2 hrs', l: 'Tiempo objetivo de atención crítica', c: 'text-amber-200' },
              { icon: <Radio size={18} className="text-emerald-400" />, v: 'SITRAD', l: 'Monitoreo remoto y alertas en tiempo real', c: 'text-emerald-300' },
              { icon: <ShieldCheck size={18} className="text-blue-400" />, v: '100%', l: 'Trazabilidad digital y firma en planta', c: 'text-blue-200' },
            ]).map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-8 whitespace-nowrap">
                {m.icon}
                <span className="text-white font-extrabold text-lg">{m.v}</span>
                <span className={`text-sm font-medium ${m.c}`}>{m.l}</span>
                <span className="text-slate-700 mx-2">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Servicios */}
      <section id="servicios" className="bg-slate-100/80 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Soluciones integrales en refrigeración comercial e industrial</h2>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto">Ingeniería, instalación, mantención y monitoreo para tu planta productiva.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {servicios.map(s => (
              <div key={s.t} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 grid place-items-center mb-5">{s.icon}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.t}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Cotización */}
      <section id="cotizar" className="bg-slate-100/80 py-20 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-8 shadow-xl">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">Cotiza tu proyecto o servicio técnico</h2>
            <p className="text-slate-300 mb-6">Envía tu requerimiento y un ingeniero especialista te responderá con una propuesta técnica y económica.</p>
            <ol className="space-y-4 mb-6">
              {['Envías tu requerimiento', 'Evaluación por ingeniero especialista', 'Respuesta formal con código de seguimiento'].map((p, i) => (
                <li key={p} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-sky-500 text-slate-950 font-bold grid place-items-center text-sm">{i + 1}</span>
                  <span className="text-slate-200 font-medium">{p}</span>
                </li>
              ))}
            </ol>
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck size={18} className="text-sky-400 mt-0.5" />
              <div className="text-xs text-slate-300">
                <b className="text-white">Respaldo normativo:</b> Tus datos están protegidos bajo la Ley N.° 19.628. No compartimos información con terceros.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg">
              {cod ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto mb-4"><CheckCircle2 size={32} /></div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">¡Solicitud recibida!</h3>
                  <p className="text-slate-500 mb-4">Tu comprobante oficial:</p>
                  <div className="font-mono text-2xl font-bold text-sky-600 mb-6">{cod}</div>
                  <button onClick={() => { setCod(null); setF({ empresa: '', correo: '', rubro: 'Lácteo', desc: '', acepta: false }) }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg transition">
                    Enviar otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={enviar} noValidate className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Empresa y contacto</label>
                      <input value={f.empresa} onChange={e => setF({ ...f, empresa: e.target.value })} placeholder="Ej. Lácteos del Sur - Juan Pérez" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 transition" />
                      {E('empresa')}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo</label>
                      <input value={f.correo} onChange={e => setF({ ...f, correo: e.target.value })} placeholder="contacto@empresa.cl" className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 transition" />
                      {E('correo')}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rubro</label>
                    <select value={f.rubro} onChange={e => setF({ ...f, rubro: e.target.value })} className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 transition">
                      {['Agroindustrial', 'Lácteo', 'Pesquero', 'Cárnico'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción del requerimiento</label>
                    <textarea rows={4} value={f.desc} onChange={e => setF({ ...f, desc: e.target.value })} placeholder="Describe el equipo, falla o proyecto de refrigeración que necesitas cotizar..." className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/15 transition" />
                    {E('desc')}
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <label className="flex items-start gap-2 text-sm text-slate-700">
                      <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" checked={f.acepta} onChange={e => setF({ ...f, acepta: e.target.checked })} />
                      Acepto el tratamiento de mis datos (Ley N.° 19.628)
                    </label>
                  </div>
                  {E('acepta')}
                  {serverErr && <p className="text-red-600 text-sm">{serverErr}</p>}
                  <button disabled={loading} className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3.5 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send size={16} /> {loading ? 'Enviando...' : 'Enviar solicitud'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <img src={logoJGFrio} alt="JG Frío & Agroindustria" className="h-28 w-auto object-contain" />
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} · Acceso interno disponible para personal autorizado</div>
          <button onClick={onLogin} className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 hover:text-sky-300 transition">
            <Lock size={14} /> Portal interno
          </button>
        </div>
      </footer>
    </div>
  )
}