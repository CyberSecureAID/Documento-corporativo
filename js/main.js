// main.js — Lógica de la herramienta de Asignación de Recursos
(function(){
  "use strict";
  var COLORS=['#4F9CF9','#38BDF8','#22D3EE','#2DD4BF','#34D399','#818CF8','#A78BFA','#F472B6','#60A5FA','#4ADE80','#93C5FD','#5EEAD4'];

  // ── Logos oficiales de North Peak (tomados del repositorio de la empresa) ──
  // NP_LOGO_DATA (PNG base64 + aspect ratio) se define al final del script.
  var LOGOS=[
    {id:"np-hero",name:"Vertical · color",dark:false},
    {id:"np-hero-light",name:"Vertical · claro",dark:true},
    {id:"np-horiz",name:"Horizontal · color",dark:false},
    {id:"np-horiz-light",name:"Horizontal · claro",dark:true},
    {id:"np-footer",name:"Horizontal · pie (dorado)",dark:true},
    {id:"np-mark",name:"Marca",dark:false}
  ];
  // NP_LOGO_DATA se define en js/logos.js (cargado antes que main.js)

  var TEMPLATES={
    obra:{label:"Costos de obra (construcción)",desc:"Job costing: mano de obra, materiales, equipos, subcontratistas, overhead, utilidad.",sectors:[
      {name:"Mano de obra",en:"Labor",type:"percent",value:35},{name:"Materiales",en:"Materials",type:"percent",value:30},
      {name:"Equipos",en:"Equipment",type:"percent",value:10},{name:"Subcontratistas",en:"Subcontractors",type:"percent",value:12},
      {name:"Gastos generales",en:"Overhead",type:"percent",value:5},{name:"Órdenes de cambio",en:"Change orders",type:"percent",value:3},
      {name:"Utilidad",en:"Profit",type:"percent",value:5}]},
    empresa:{label:"Presupuesto empresarial",desc:"Reparto general: operativos, nómina, impuestos, reserva y utilidad.",sectors:[
      {name:"Costos operativos",en:"Operating costs",type:"percent",value:30},{name:"Nómina y personal",en:"Payroll & staff",type:"percent",value:25},
      {name:"Impuestos",en:"Taxes",type:"percent",value:15},{name:"Servicios y marketing",en:"Services & marketing",type:"percent",value:8},
      {name:"Reserva / contingencia",en:"Reserve & contingency",type:"percent",value:12},{name:"Utilidad neta",en:"Net profit",type:"percent",value:10}]},
    profitfirst:{label:"Profit First",desc:"Método de Michalowicz: la utilidad se aparta primero (5 / 50 / 15 / 30).",sectors:[
      {name:"Utilidad",en:"Profit",type:"percent",value:5},{name:"Pago al dueño",en:"Owner's pay",type:"percent",value:50},
      {name:"Impuestos",en:"Taxes",type:"percent",value:15},{name:"Gastos operativos",en:"Operating expenses",type:"percent",value:30}]},
    pl:{label:"Estado de resultados (P&L)",desc:"Costo de ventas, gastos, impuestos y utilidad neta.",sectors:[
      {name:"Costo de ventas",en:"Cost of goods sold",type:"percent",value:45},{name:"Gastos operativos",en:"Operating expenses",type:"percent",value:25},
      {name:"Gastos administrativos",en:"General & administrative",type:"percent",value:10},{name:"Impuestos",en:"Taxes",type:"percent",value:12},
      {name:"Utilidad neta",en:"Net income",type:"percent",value:8}]},
    sov:{label:"Schedule of Values (AIA G703)",desc:"Formato estándar de construcción por partidas de obra.",sectors:[
      {name:"Trabajos preliminares",en:"General conditions",type:"percent",value:8},{name:"Cimentación",en:"Foundation",type:"percent",value:15},
      {name:"Estructura",en:"Structure / framing",type:"percent",value:22},{name:"Instalaciones (MEP)",en:"Mechanical, electrical, plumbing",type:"percent",value:20},
      {name:"Acabados",en:"Finishes",type:"percent",value:18},{name:"Retención",en:"Retainage",type:"percent",value:5},
      {name:"Utilidad y overhead",en:"Overhead & profit",type:"percent",value:12}]},
    depto:{label:"Presupuesto por departamento",desc:"Reparto del ingreso entre las áreas de la empresa.",sectors:[
      {name:"Producción",en:"Production",type:"percent",value:35},{name:"Ventas y marketing",en:"Sales & marketing",type:"percent",value:20},
      {name:"Administración",en:"Administration",type:"percent",value:15},{name:"Tecnología",en:"Technology",type:"percent",value:10},
      {name:"Recursos humanos",en:"Human resources",type:"percent",value:10},{name:"Reserva",en:"Reserve",type:"percent",value:10}]},
    regla:{label:"Regla 50 / 30 / 20",desc:"Reparto simple: necesidades, deseos y ahorro.",sectors:[
      {name:"Necesidades",en:"Needs",type:"percent",value:50},{name:"Deseos",en:"Wants",type:"percent",value:30},
      {name:"Ahorro e inversión",en:"Savings & investment",type:"percent",value:20}]}
  };

  var INFO={
    "__income":["Ingreso reportado del periodo","Es el dinero total que la empresa declara para el periodo (semana, quincena, mes o trimestre). Es el punto de partida: sobre este monto repartes el capital según lo que te indiquen."],
    "__how":["Cómo funciona","1) Escribe el ingreso que te reportaron.\n\n2) Elige una plantilla (botón Plantillas) o define los sectores.\n\n3) (Opcional) Elige el logo de la empresa arriba a la izquierda: puedes cargar el tuyo o usar uno de North Peak. Nunca viene puesto por defecto, para no equivocarte de empresa.\n\n4) (Opcional) Guarda el periodo y compáralo luego para el análisis de variación.\n\n5) Exporta. El PDF trae portada con el logo; el documento sale en inglés."],
    "Mano de obra":["Mano de obra (Labor)","Pago a los trabajadores: salarios, cargas sociales, seguros y beneficios. En construcción suele ser el costo mayor, cerca del 60%."],
    "Materiales":["Materiales (Materials)","Todo lo que se compra para construir: cemento, acero, madera, acabados."],
    "Equipos":["Equipos (Equipment)","Maquinaria y equipo: renta, combustible, mantenimiento y depreciación."],
    "Subcontratistas":["Subcontratistas (Subcontractors)","Cuadrillas o empresas externas que ejecutan parte de la obra."],
    "Gastos generales":["Gastos generales / Overhead","Costos indirectos de operar: oficina, administración, seguros, supervisión. 5%–15%."],
    "Órdenes de cambio":["Órdenes de cambio (Change orders)","Trabajo adicional aprobado después de empezar la obra."],
    "Utilidad":["Utilidad (Profit)","La ganancia después de cubrir costos. (Ingreso − Costo total) ÷ Ingreso."],
    "Costos operativos":["Costos operativos (OPEX)","Gastos del día a día: alquiler, servicios, suministros, mantenimiento."],
    "Nómina y personal":["Nómina y personal (Payroll)","Sueldos, prestaciones y seguridad social. 15%–30%."],
    "Impuestos":["Impuestos (Taxes)","Reserva para obligaciones fiscales (renta, GST/HST). 15%–20%."],
    "Servicios y marketing":["Servicios y marketing","Proveedores externos, software, publicidad. Marketing 5%–10%."],
    "Reserva / contingencia":["Reserva / contingencia","Ahorro para imprevistos. 5%–15%."],
    "Utilidad neta":["Utilidad neta","Lo que queda para los dueños después de cubrir todo."],
    "Pago al dueño":["Pago al dueño (Owner's pay)","El sueldo del dueño. En Profit First se aparta antes que los gastos."],
    "Gastos operativos":["Gastos operativos (OpEx)","Lo que la empresa gasta para operar y no entra en otras cuentas."],
    "Costo de ventas":["Costo de ventas (COGS)","Costo directo de producir lo vendido."],
    "Gastos administrativos":["Gastos administrativos (G&A)","Costos de administrar: dirección, contabilidad, oficina."],
    "Trabajos preliminares":["Trabajos preliminares (General conditions)","Puesta en marcha de la obra: cerca, oficina de sitio, supervisión, permisos."],
    "Cimentación":["Cimentación (Foundation)","Excavación, zapatas y cimientos que soportan la estructura."],
    "Estructura":["Estructura (Structure / framing)","Columnas, vigas, losas y armazón del edificio."],
    "Instalaciones (MEP)":["Instalaciones MEP","Mecánica, electricidad y plomería."],
    "Acabados":["Acabados (Finishes)","Pisos, pintura, carpintería y terminaciones."],
    "Retención":["Retención (Retainage)","Porcentaje que el dueño retiene de cada pago hasta terminar la obra. 5%–10%."],
    "Utilidad y overhead":["Utilidad y overhead","El margen del contratista más sus costos generales."],
    "Producción":["Producción","Recursos del área que genera el producto o servicio."],
    "Ventas y marketing":["Ventas y marketing","Presupuesto comercial: publicidad, promoción, ventas."],
    "Administración":["Administración","Gestión general: dirección, finanzas, oficina."],
    "Tecnología":["Tecnología","Software, equipos y sistemas."],
    "Recursos humanos":["Recursos humanos","Reclutamiento, capacitación y gestión del personal."],
    "Reserva":["Reserva","Fondo para imprevistos o proyectos futuros."],
    "Necesidades":["Necesidades (Needs)","Lo indispensable. En 50/30/20 es el 50%."],
    "Deseos":["Deseos (Wants)","Lo no indispensable. En 50/30/20 es el 30%."],
    "Ahorro e inversión":["Ahorro e inversión (Savings)","Lo que se guarda o invierte. En 50/30/20 es el 20%."]
  };

  var PERIOD_EN={Semanal:"Weekly",Quincenal:"Biweekly",Mensual:"Monthly",Trimestral:"Quarterly"};

  // ── Diccionario ES→EN (construcción, finanzas, contabilidad) para autotraducir sectores ──
  var DICT={
    "mano de obra":"Labor","materiales":"Materials","material":"Material","equipos":"Equipment","equipo":"Equipment",
    "maquinaria":"Machinery","herramientas":"Tools","combustible":"Fuel","combustibles":"Fuel","gasolina":"Gasoline","diesel":"Diesel",
    "subcontratistas":"Subcontractors","subcontratista":"Subcontractor","proveedores":"Suppliers","proveedor":"Supplier",
    "gastos generales":"Overhead","gastos":"Expenses","gasto":"Expense","costos":"Costs","costo":"Cost","coste":"Cost","costes":"Costs",
    "gastos operativos":"Operating expenses","costos operativos":"Operating costs","gastos administrativos":"Administrative expenses",
    "ordenes de cambio":"Change orders","orden de cambio":"Change order","utilidad":"Profit","utilidades":"Profits","ganancia":"Profit","ganancias":"Profits",
    "utilidad neta":"Net profit","utilidad bruta":"Gross profit","margen":"Margin","nomina":"Payroll","nomina y personal":"Payroll & staff",
    "salarios":"Wages","sueldos":"Salaries","personal":"Staff","empleados":"Employees","beneficios":"Benefits","prestaciones":"Benefits",
    "impuestos":"Taxes","impuesto":"Tax","iva":"VAT","renta":"Income tax","seguros":"Insurance","seguro":"Insurance","fianza":"Bond","fianzas":"Bonds",
    "reserva":"Reserve","reservas":"Reserves","contingencia":"Contingency","reserva de contingencia":"Contingency reserve","reserva contingencia":"Contingency reserve",
    "ahorro":"Savings","ahorros":"Savings","inversion":"Investment","inversiones":"Investments","ahorro e inversion":"Savings & investment",
    "servicios":"Services","servicio":"Service","servicios publicos":"Utilities","marketing":"Marketing","publicidad":"Advertising","ventas":"Sales",
    "servicios y marketing":"Services & marketing","ventas y marketing":"Sales & marketing","comercial":"Commercial",
    "produccion":"Production","operaciones":"Operations","logistica":"Logistics","transporte":"Transportation","flete":"Freight","envio":"Shipping",
    "almacen":"Warehouse","inventario":"Inventory","compras":"Procurement","adquisiciones":"Procurement",
    "administracion":"Administration","administrativo":"Administrative","direccion":"Management","gerencia":"Management","oficina":"Office",
    "tecnologia":"Technology","software":"Software","sistemas":"Systems","informatica":"IT","equipo de computo":"Computer equipment",
    "recursos humanos":"Human resources","capacitacion":"Training","reclutamiento":"Recruitment","legal":"Legal","contabilidad":"Accounting","finanzas":"Finance",
    "mantenimiento":"Maintenance","reparaciones":"Repairs","reparacion":"Repair","limpieza":"Cleaning","seguridad":"Security","vigilancia":"Security",
    "alquiler":"Rent","renta de equipo":"Equipment rental","arrendamiento":"Lease","depreciacion":"Depreciation","amortizacion":"Amortization",
    "cimentacion":"Foundation","estructura":"Structure","acabados":"Finishes","instalaciones":"Installations","electricidad":"Electrical",
    "plomeria":"Plumbing","fontaneria":"Plumbing","carpinteria":"Carpentry","albanileria":"Masonry","pintura":"Painting","excavacion":"Excavation",
    "concreto":"Concrete","hormigon":"Concrete","cemento":"Cement","acero":"Steel","madera":"Lumber","ladrillo":"Brick","techado":"Roofing","techo":"Roof",
    "trabajos preliminares":"General conditions","preliminares":"Preliminaries","retencion":"Retainage","garantia":"Warranty",
    "permisos":"Permits","licencias":"Licenses","estudios":"Studies","diseno":"Design","ingenieria":"Engineering","arquitectura":"Architecture",
    "supervision":"Supervision","gestion":"Management","planificacion":"Planning","control de calidad":"Quality control","calidad":"Quality",
    "necesidades":"Needs","deseos":"Wants","costo de ventas":"Cost of goods sold","pago al dueno":"Owner's pay","dueno":"Owner",
    "reinversion":"Reinvestment","dividendos":"Dividends","capital":"Capital","deuda":"Debt","prestamo":"Loan","prestamos":"Loans","intereses":"Interest",
    "emergencias":"Emergencies","imprevistos":"Contingencies","varios":"Miscellaneous","otros":"Other","otros gastos":"Other expenses",
    "proyecto":"Project","proyectos":"Projects","obra":"Project","obras":"Works","construccion":"Construction","desarrollo":"Development",
    "energia":"Energy","agua":"Water","gas":"Gas","internet":"Internet","telefonia":"Telephone","comunicaciones":"Communications","viaticos":"Travel expenses","viajes":"Travel","viaje":"Travel","gastos de viaje":"Travel expenses","alimentacion":"Meals","comida":"Meals","hospedaje":"Lodging","alojamiento":"Lodging","publicidad y marketing":"Advertising & marketing","bonos":"Bonuses","comisiones":"Commissions"
  };
  var STOP={"de":1,"del":1,"la":1,"el":1,"los":1,"las":1,"y":1,"e":1,"para":1,"por":1,"a":1,"en":1,"con":1,"su":1,"al":1};
  function norm(s){return (s||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
  function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):s;}
  function translateES(es){var key=norm(es);if(!key)return "";
    if(DICT[key])return DICT[key];
    var words=key.split(/\s+/),out=[],hit=false;
    words.forEach(function(w){if(STOP[w])return;if(DICT[w]){out.push(DICT[w].toLowerCase());hit=true;}else out.push(w);});
    if(hit&&out.length)return cap(out.join(" "));
    return es;}
  var MONTHS_EN=["January","February","March","April","May","June","July","August","September","October","November","December"];
  var T={title:"Resource Allocation Report",income:"Reported income",assigned:"Total allocated",rest:"Unallocated",
    sector:"Sector",type:"Type",rate:"Rate / Value",amount:"Allocated amount",pctcol:"% of income",
    percent:"Percentage",fixed:"Fixed amount",total:"TOTAL",prepared:"Prepared by",status:"Status",
    full:"Fully allocated",under:"Under-allocated",over:"OVER-allocated",
    previous:"Previous",variance:"Variance",varpct:"Var %",vslabel:"vs."};

  var KEY="asignacion_recursos_v5";
  var state=null, chartType="doughnut";

  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  function todayISO(){var d=new Date();return d.toISOString().slice(0,10);}
  function fromTemplate(k){return TEMPLATES[k].sectors.map(function(s){return {id:uid(),name:s.name,en:s.en,type:s.type,value:s.value};});}
  function fresh(){return {company:"North Peak Construction Alliance Inc.",preparer:"",period:"Mensual",date:todayISO(),currency:"CAD",income:700000,sectors:fromTemplate("empresa"),history:[],compareId:null,logo:null,showChart:true};}
  function load(){try{var r=localStorage.getItem(KEY);state=r?JSON.parse(r):fresh();}catch(e){state=fresh();} if(!state||!state.sectors)state=fresh(); if(!state.history)state.history=[]; if(state.compareId===undefined)state.compareId=null; if(state.preparer===undefined)state.preparer=""; if(state.logo===undefined)state.logo=null; if(state.showChart===undefined)state.showChart=true;}
  function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}}

  var CURSYM={CAD:"$",USD:"$",USDT:"₮",EUR:"€",MXN:"$"};
  function money(n){var v=isFinite(n)?n:0;
    if(state.currency==="USDT")return "₮"+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    try{return new Intl.NumberFormat('en-CA',{style:'currency',currency:state.currency,currencyDisplay:'narrowSymbol'}).format(v);}
    catch(e){return (CURSYM[state.currency]||"$")+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}}
  function moneyShort(n){var v=isFinite(n)?n:0,s=CURSYM[state.currency]||"$",a=Math.abs(v);
    if(a>=1e6)return s+(v/1e6).toFixed(a>=1e7?0:1)+"M"; if(a>=1e3)return s+(v/1e3).toFixed(a>=1e5?0:1)+"K"; return s+v.toFixed(0);}

  function compute(){
    var inc=parseFloat(state.income)||0;
    var rows=state.sectors.map(function(s,i){
      var amt=s.type==="percent"?inc*(parseFloat(s.value)||0)/100:(parseFloat(s.value)||0);
      return {id:s.id,name:s.name,en:s.en,type:s.type,value:s.value,amount:amt,color:COLORS[i%COLORS.length],pct:inc>0?amt/inc*100:0};});
    var assigned=rows.reduce(function(a,r){return a+r.amount;},0);
    return {inc:inc,rows:rows,assigned:assigned,rest:inc-assigned};}
  function compareBase(){if(!state.compareId)return null;for(var i=0;i<state.history.length;i++)if(state.history[i].id===state.compareId)return state.history[i];return null;}
  function baseAmountFor(r,base){if(!base)return null;var key=(r.en&&r.en.trim())||r.name;for(var i=0;i<base.rows.length;i++){var b=base.rows[i];if(((b.en&&b.en.trim())||b.name)===key)return b.amount;}return 0;}
  function chartItems(c,lang){
    var items=c.rows.filter(function(r){return r.amount>0;}).map(function(r){
      return {label:lang==="en"?((r.en&&r.en.trim())?r.en.trim():r.name):r.name,value:r.amount,color:r.color,pct:r.pct};});
    if(c.rest>0.005)items.push({label:lang==="en"?"Unallocated":"Sin asignar",value:c.rest,color:"#94A3B8",pct:c.inc>0?c.rest/c.inc*100:0});
    return items;}

  // ══ MOTOR DE GRÁFICAS ══
  function drawChart(canvas,o){
    var dpr=Math.max(1,window.devicePixelRatio||1),W=o.W,H=o.H,th=o.theme;
    canvas.width=W*dpr;canvas.height=H*dpr;canvas.style.width=W+"px";canvas.style.height=H+"px";
    var ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    if(th.bg){ctx.fillStyle=th.bg;ctx.fillRect(0,0,W,H);}
    var F="'Plus Jakarta Sans',Arial,sans-serif",items=o.items,total=o.total||items.reduce(function(a,b){return a+b.value;},0);
    var top=o.title?38:14;
    if(o.title){ctx.fillStyle=th.text;ctx.font="700 17px "+F;ctx.textBaseline="alphabetic";ctx.fillText(o.title,16,25);
      if(o.subtitle){ctx.fillStyle=th.text2;ctx.font="500 11px "+F;ctx.fillText(o.subtitle,16,40);top+=14;}}
    var legendW=o.legend?Math.min(W*0.46,380):0,area={x:14,y:top,w:W-28-legendW,h:H-top-14},money=o.moneyFn;
    if(o.kind==="doughnut"){
      var cx=area.x+area.w/2,cy=area.y+area.h/2,R=Math.min(area.w,area.h)/2-6,ri=R*0.6,a0=-Math.PI/2;
      items.forEach(function(it){var sw=total>0?it.value/total*Math.PI*2:0;
        ctx.beginPath();ctx.arc(cx,cy,R,a0,a0+sw);ctx.arc(cx,cy,ri,a0+sw,a0,true);ctx.closePath();ctx.fillStyle=it.color;ctx.fill();
        if(sw>0.34){var mid=a0+sw/2,rr=(R+ri)/2;ctx.fillStyle="#0A0F1E";ctx.font="700 12px "+F;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText((it.value/total*100).toFixed(0)+"%",cx+Math.cos(mid)*rr,cy+Math.sin(mid)*rr);}
        a0+=sw;});
      ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle=th.text2;ctx.font="500 10px "+F;ctx.fillText("TOTAL",cx,cy-9);
      ctx.fillStyle=th.text;ctx.font="700 15px "+F;ctx.fillText(money(total),cx,cy+8);
    }else if(o.kind==="bar"){
      var n=items.length,gap=area.w*0.04/n+6,bw=(area.w-gap*(n+1))/n,maxv=Math.max.apply(null,items.map(function(i){return i.value;}))||1,baseY=area.y+area.h-24;
      ctx.strokeStyle=th.grid;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(area.x,baseY);ctx.lineTo(area.x+area.w,baseY);ctx.stroke();
      items.forEach(function(it,i){var bh=(it.value/maxv)*(area.h-46),x=area.x+gap+i*(bw+gap),y=baseY-bh,rad=Math.min(6,bw/2);
        ctx.fillStyle=it.color;roundRect(ctx,x,y,bw,bh,rad);ctx.fill();
        ctx.fillStyle=th.text;ctx.font="700 10px "+F;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(moneyShort(it.value),x+bw/2,y-5);
        ctx.fillStyle=th.text2;ctx.font="500 10px "+F;ctx.fillText(it.pct.toFixed(0)+"%",x+bw/2,baseY+14);});
    }else if(o.kind==="hbar"){
      var n2=items.length,rh=Math.min(34,area.h/n2),maxv2=Math.max.apply(null,items.map(function(i){return i.value;}))||1;
      var labelW=o.legend?0:Math.min(120,area.w*0.34),barX=area.x+labelW,barsW=area.w-labelW-70;
      items.forEach(function(it,i){var y=area.y+i*rh+rh*0.15,bh=rh*0.6,bw=(it.value/maxv2)*barsW;
        if(!o.legend){ctx.fillStyle=th.text;ctx.font="600 11px "+F;ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(clip(ctx,it.label,labelW-8),area.x,y+bh/2);}
        ctx.fillStyle=it.color;roundRect(ctx,barX,y,Math.max(bw,2),bh,4);ctx.fill();
        ctx.fillStyle=th.text;ctx.font="700 10px "+F;ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(moneyShort(it.value)+"  "+it.pct.toFixed(0)+"%",barX+Math.max(bw,2)+6,y+bh/2);});
    }else if(o.kind==="line"){
      var n3=items.length,baseY3=area.y+area.h-24,plotH=area.h-46,maxv3=Math.max.apply(null,items.map(function(i){return i.value;}))||1;
      var stepX=n3>1?(area.w-20)/(n3-1):0,x0=area.x+10;
      ctx.strokeStyle=th.grid;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(area.x,baseY3);ctx.lineTo(area.x+area.w,baseY3);ctx.stroke();
      var pts=items.map(function(it,i){return {x:x0+i*stepX,y:baseY3-(it.value/maxv3)*plotH,it:it};});
      var grad=ctx.createLinearGradient(0,area.y,0,baseY3);grad.addColorStop(0,"rgba(79,156,249,0.35)");grad.addColorStop(1,"rgba(79,156,249,0.02)");
      ctx.beginPath();ctx.moveTo(pts[0].x,baseY3);pts.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.lineTo(pts[n3-1].x,baseY3);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
      ctx.beginPath();pts.forEach(function(p,i){i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.strokeStyle="#4F9CF9";ctx.lineWidth=2.5;ctx.stroke();
      pts.forEach(function(p){ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle=p.it.color;ctx.fill();ctx.strokeStyle=th.bg||"#0A0F1E";ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle=th.text;ctx.font="700 10px "+F;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(moneyShort(p.it.value),p.x,p.y-9);
        ctx.fillStyle=th.text2;ctx.font="500 9px "+F;ctx.fillText(clip(ctx,p.it.label,stepX||60),p.x,baseY3+13);});
    }
    if(o.legend){var lx=W-legendW+6,ly=area.y+4,lh=Math.min(26,(area.h-8)/items.length);ctx.textBaseline="middle";
      items.forEach(function(it,i){var y=ly+i*lh+lh/2;ctx.fillStyle=it.color;roundRect(ctx,lx,y-6,12,12,3);ctx.fill();
        ctx.fillStyle=th.text;ctx.font="600 12px "+F;ctx.textAlign="left";ctx.fillText(clip(ctx,it.label,legendW-150),lx+20,y);
        ctx.fillStyle=th.text2;ctx.font="500 11px "+F;ctx.textAlign="right";ctx.fillText(money(it.value)+"  ·  "+it.pct.toFixed(1)+"%",W-14,y);});}
  }
  function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function clip(ctx,t,max){t=String(t);if(ctx.measureText(t).width<=max)return t;while(t.length>1&&ctx.measureText(t+"…").width>max)t=t.slice(0,-1);return t+"…";}
  var THEME_DARK={bg:null,text:"#E6ECF7",text2:"#94A3C4",grid:"rgba(120,160,230,0.15)"};
  var THEME_LIGHT={bg:"#FFFFFF",text:"#0F172A",text2:"#64748B",grid:"rgba(15,23,42,0.12)"};
  function drawScreenChart(){var c=compute(),box=document.querySelector(".chart-box");if(!box)return;
    var W=Math.max(240,Math.floor(box.clientWidth)),H=250;
    drawChart($("chartCanvas"),{items:chartItems(c,"es"),total:c.inc,kind:chartType,legend:false,theme:THEME_DARK,W:W,H:H,moneyFn:money});}
  function chartExportImage(kindOverride,W,H){var c=compute();if(!chartItems(c,"en").length)return null;var cv=document.createElement("canvas");
    drawChart(cv,{items:chartItems(c,"en"),total:c.inc,kind:kindOverride||chartType,legend:true,theme:THEME_LIGHT,W:W||1000,H:H||460,moneyFn:money,
      title:(state.company||"Company")+" — Allocation ("+chartTypeName(kindOverride)+")",subtitle:(PERIOD_EN[state.period]||state.period)+" · "+dateEn()+" · "+state.currency});
    try{return cv.toDataURL("image/png",1);}catch(e){return null;}}
  function chartTypeName(k){return {doughnut:"Doughnut",bar:"Bar",hbar:"Horizontal bar",line:"Line"}[k||chartType]||"Chart";}

  // ══ LOGO ══
  function toPng(src,maxW){return new Promise(function(res,rej){var img=new Image();img.onload=function(){
    var w=img.naturalWidth||img.width,h=img.naturalHeight||img.height,ar=w/h||1,tw=Math.min(maxW||520,Math.max(w*2,400)),thh=Math.round(tw/ar);
    var cv=document.createElement("canvas");cv.width=tw;cv.height=thh;var ctx=cv.getContext("2d");ctx.drawImage(img,0,0,tw,thh);
    try{res({dataUrl:cv.toDataURL("image/png"),ar:ar});}catch(e){rej(e);}};img.onerror=rej;img.src=src;});}
  function svgSrc(svg){return "data:image/svg+xml;base64,"+btoa(unescape(encodeURIComponent(svg)));}
  function setLogo(obj){state.logo=obj;save();renderLogo();}
  function renderLogo(){var btn=$("logoBtn"),img=$("logoImg");
    if(state.logo&&state.logo.dataUrl){btn.classList.add("has-logo");img.src=state.logo.dataUrl;}
    else{btn.classList.remove("has-logo");img.removeAttribute("src");}}

  var $=function(id){return document.getElementById(id);};
  function render(){
    $("fCompany").value=state.company;$("fPreparer").value=state.preparer||"";$("fPeriod").value=state.period;$("fDate").value=state.date;$("fCurrency").value=state.currency;
    $("curSign").textContent=CURSYM[state.currency]||"$";
    if(document.activeElement!==$("fIncome"))$("fIncome").value=state.income;
    var d=new Date(state.date+"T00:00:00");var mes=isNaN(d)?"":d.toLocaleDateString('es',{month:'long',year:'numeric'});
    $("periodNote").textContent="Periodo "+state.period.toLowerCase()+(mes?" · "+mes:"")+" · "+state.currency;
    $("showChart").checked=state.showChart!==false;document.querySelector(".chart-box").classList.toggle("off",state.showChart===false);
    renderLogo();computedRender();renderSectors();renderHistory();
  }
  function computedRender(){
    var c=compute(),base=compareBase();
    $("sumIncome").textContent=money(c.inc);$("sumAssigned").textContent=money(c.assigned);$("sumRest").textContent=money(c.rest);
    var over=c.rest<-0.005,full=Math.abs(c.rest)<0.005;
    $("restCard").className="card"+(over?" warn":(full?" ok":""));
    $("restState").textContent=over?"Te pasaste del ingreso":(full?"Todo asignado ✓":"Falta por asignar");
    $("pctTotal").textContent=(c.inc>0?(c.assigned/c.inc*100):0).toFixed(1)+"% asignado";
    var bar=$("distroBar");bar.innerHTML="";
    c.rows.forEach(function(r){if(r.amount<=0)return;var s=document.createElement("div");s.className="distro__seg";s.style.width=(c.inc>0?Math.min(r.amount/c.inc*100,100):0)+"%";s.style.background=r.color;s.title=r.name+" · "+money(r.amount);bar.appendChild(s);});
    if(c.rest>0.005){var s=document.createElement("div");s.className="distro__seg rest";s.style.width=Math.min(c.rest/c.inc*100,100)+"%";bar.appendChild(s);}
    var pt=$("pctTable");pt.innerHTML="";
    c.rows.forEach(function(r){var row=document.createElement("div");row.className="pct-row";var varHtml="";
      if(base){var prev=baseAmountFor(r,base),dv=r.amount-prev;varHtml='<span class="pct-var '+(dv>=0?"up":"down")+'">'+(dv>=0?"▲":"▼")+" "+moneyShort(Math.abs(dv))+'</span>';}
      row.innerHTML='<span class="pct-dot" style="background:'+r.color+'"></span><span class="pct-name">'+escapeHtml(r.name)+'</span>'+(base?varHtml:'<span class="pct-amt">'+money(r.amount)+'</span>')+'<span class="pct-pct">'+r.pct.toFixed(1)+'%</span>';
      pt.appendChild(row);});
    var tot=document.createElement("div");tot.className="pct-row total";
    tot.innerHTML='<span class="pct-dot" style="background:transparent"></span><span class="pct-name b">Total asignado</span><span class="pct-amt">'+money(c.assigned)+'</span><span class="pct-pct">'+(c.inc>0?(c.assigned/c.inc*100):0).toFixed(1)+'%</span>';
    pt.appendChild(tot);drawScreenChart();
  }
  function renderSectors(){
    var c=compute(),host=$("sectors");host.innerHTML="";
    c.rows.forEach(function(r){var el=document.createElement("div");el.className="sector";
      el.innerHTML='<div class="sector__top"><div class="namewrap"><span class="sector__color" style="background:'+r.color+'"></span><input class="sector__name" value="'+escapeAttr(r.name)+'" data-name="'+r.id+'"></div>'
        +'<select class="sector__type" data-type="'+r.id+'"><option value="percent"'+(r.type==="percent"?" selected":"")+'>%</option><option value="fixed"'+(r.type==="fixed"?" selected":"")+'>Monto</option></select>'
        +'<input class="sector__val" data-val="'+r.id+'" inputmode="decimal" value="'+escapeAttr(String(r.value))+'">'
        +'<span class="sector__amount">'+money(r.amount)+'</span>'
        +'<span class="sector__btns"><button class="ibtn" data-info="'+escapeAttr(r.name)+'" title="Qué es">i</button><button class="ibtn del" data-del="'+r.id+'" title="Quitar">×</button></span></div>'
        +'<div class="sector__en"><label>EN</label><input data-en="'+r.id+'" value="'+escapeAttr(r.en||"")+'" placeholder="Nombre en inglés (para el documento)"></div>';
      host.appendChild(el);});
  }
  function renderHistory(){
    var list=$("snapList");list.innerHTML="";
    if(!state.history.length){list.innerHTML='<div class="empty">Aún no has guardado ningún periodo. Usa «Guardar este periodo» para empezar tu historial y poder comparar.</div>';}
    else{state.history.slice().reverse().forEach(function(sn){var el=document.createElement("div");el.className="snap"+(sn.id===state.compareId?" active":"");
      el.innerHTML='<div class="snap__t">'+escapeHtml(sn.label)+'<small>'+(PERIOD_EN[sn.period]||sn.period)+' · '+escapeHtml(sn.date)+'</small></div><span class="snap__v">'+money(sn.income)+'</span>'
        +'<button class="mini '+(sn.id===state.compareId?"on":"")+'" data-cmp="'+sn.id+'">'+(sn.id===state.compareId?"Comparando":"Comparar")+'</button><button class="mini" data-loadsnap="'+sn.id+'">Cargar</button><button class="mini del" data-delsnap="'+sn.id+'">×</button>';
      list.appendChild(el);});}
    var base=compareBase();$("cmpBanner").className="cmp-banner"+(base?" on":"");if(base)$("cmpLabel").textContent=base.label;
  }
  function escapeHtml(s){return (s||"").replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function escapeAttr(s){return escapeHtml(s);}

  $("fCompany").addEventListener("input",function(){state.company=this.value;save();});
  $("fPreparer").addEventListener("input",function(){state.preparer=this.value;save();});
  $("fPeriod").addEventListener("change",function(){state.period=this.value;save();render();});
  $("fDate").addEventListener("change",function(){state.date=this.value;save();render();});
  $("fCurrency").addEventListener("change",function(){state.currency=this.value;save();render();});
  $("fIncome").addEventListener("input",function(){state.income=parseFloat(this.value.replace(/,/g,""))||0;save();computedRender();softAmounts();});

  var sectorsEl=$("sectors");
  function getSector(id){for(var i=0;i<state.sectors.length;i++)if(state.sectors[i].id===id)return state.sectors[i];return null;}
  sectorsEl.addEventListener("input",function(e){var t=e.target;
    if(t.hasAttribute("data-name")){var id=t.getAttribute("data-name");set(id,"name",t.value);
      var s=getSector(id);if(s&&!s.enManual){var tr=translateES(t.value);set(id,"en",tr);var enIn=sectorsEl.querySelector('[data-en="'+id+'"]');if(enIn&&document.activeElement!==enIn)enIn.value=tr;}
      save();computedRender();softAmounts();}
    else if(t.hasAttribute("data-en")){var id2=t.getAttribute("data-en");set(id2,"en",t.value);set(id2,"enManual",true);save();}
    else if(t.hasAttribute("data-val")){set(t.getAttribute("data-val"),"value",parseFloat(t.value.replace(/,/g,""))||0);save();computedRender();softAmounts();}});
  sectorsEl.addEventListener("change",function(e){if(e.target.hasAttribute("data-type")){set(e.target.getAttribute("data-type"),"type",e.target.value);save();computedRender();softAmounts();}});
  sectorsEl.addEventListener("click",function(e){var t=e.target.closest("[data-del],[data-info]");if(!t)return;
    if(t.hasAttribute("data-del")){state.sectors=state.sectors.filter(function(s){return s.id!==t.getAttribute("data-del");});save();render();}
    else if(t.hasAttribute("data-info")){openInfo(t.getAttribute("data-info"));}});
  function set(id,k,v){state.sectors.forEach(function(s){if(s.id===id)s[k]=v;});}
  function softAmounts(){var a=document.querySelectorAll(".sector__amount"),c=compute();c.rows.forEach(function(r,i){if(a[i])a[i].textContent=money(r.amount);});}

  $("addBtn").addEventListener("click",function(){state.sectors.push({id:uid(),name:"Nuevo sector",en:"New sector",type:"percent",value:0});save();render();});
  $("resetBtn").addEventListener("click",function(){if(confirm("¿Restablecer al presupuesto empresarial por defecto?")){state.sectors=fromTemplate("empresa");save();render();}});

  // Historial
  $("histToggle").addEventListener("click",function(e){if(e.target.closest("#saveSnap"))return;$("histPanel").classList.toggle("open");});
  $("saveSnap").addEventListener("click",function(e){e.stopPropagation();var c=compute();
    state.history.push({id:uid(),label:(PERIOD_EN[state.period]||state.period)+" · "+dateEn(),date:state.date,period:state.period,currency:state.currency,income:c.inc,rows:c.rows.map(function(r){return {name:r.name,en:r.en,amount:r.amount,pct:r.pct};})});
    if(state.history.length>40)state.history=state.history.slice(-40);save();$("histPanel").classList.add("open");renderHistory();});
  $("snapList").addEventListener("click",function(e){var t=e.target.closest("[data-cmp],[data-loadsnap],[data-delsnap]");if(!t)return;
    if(t.hasAttribute("data-cmp")){var id=t.getAttribute("data-cmp");state.compareId=(state.compareId===id)?null:id;save();computedRender();renderHistory();}
    else if(t.hasAttribute("data-delsnap")){var did=t.getAttribute("data-delsnap");state.history=state.history.filter(function(s){return s.id!==did;});if(state.compareId===did)state.compareId=null;save();computedRender();renderHistory();}
    else if(t.hasAttribute("data-loadsnap")){var lid=t.getAttribute("data-loadsnap"),sn=null;state.history.forEach(function(s){if(s.id===lid)sn=s;});
      if(sn&&confirm("¿Cargar los datos de «"+sn.label+"» como sectores actuales?")){state.income=sn.income;state.currency=sn.currency;state.sectors=sn.rows.map(function(r){return {id:uid(),name:r.name,en:r.en,type:"fixed",value:r.amount};});save();render();}}});
  $("cmpOff").addEventListener("click",function(){state.compareId=null;save();computedRender();renderHistory();});

  // Plantillas
  var tplList=$("tplList");
  Object.keys(TEMPLATES).forEach(function(k){var b=document.createElement("button");b.className="tpl-item";b.setAttribute("data-tpl",k);
    b.innerHTML="<b>"+escapeHtml(TEMPLATES[k].label)+"</b><span>"+escapeHtml(TEMPLATES[k].desc)+"</span>";tplList.appendChild(b);});
  var tplMenu=$("tplMenu");
  $("tplBtn").addEventListener("click",function(e){e.stopPropagation();tplMenu.classList.toggle("open");$("logoMenu").classList.remove("open");});
  document.addEventListener("click",function(e){if(!tplMenu.contains(e.target)&&e.target!==$("tplBtn"))tplMenu.classList.remove("open");
    if(!$("logoMenu").contains(e.target)&&!$("logoBtn").contains(e.target))$("logoMenu").classList.remove("open");});
  tplList.addEventListener("click",function(e){var b=e.target.closest("[data-tpl]");if(!b)return;var k=b.getAttribute("data-tpl");
    if(confirm("¿Cargar \""+TEMPLATES[k].label+"\"? Reemplaza los sectores actuales.")){state.sectors=fromTemplate(k);save();render();tplMenu.classList.remove("open");}});
  $("tplCsv").addEventListener("click",function(){var csv="Sector,Tipo,Valor,SectorEN\nMano de obra,%,35,Labor\nMateriales,%,30,Materials\nEquipos,%,10,Equipment\nSubcontratistas,%,12,Subcontractors\nGastos generales,%,5,Overhead\nUtilidad,%,8,Profit\n";
    downloadBlob(new Blob([csv],{type:"text/csv"}),"plantilla-sectores.csv");tplMenu.classList.remove("open");});

  // Logo — eventos
  var logoPresets=$("logoPresets");
  LOGOS.forEach(function(lg){var d=NP_LOGO_DATA[lg.id];if(!d)return;var b=document.createElement("button");b.className="logo-opt"+(lg.dark?" dark":"");b.setAttribute("data-logo",lg.id);b.title=lg.name;b.innerHTML='<img src="'+d.dataUrl+'" alt="'+lg.name+'">';logoPresets.appendChild(b);});
  $("logoBtn").addEventListener("click",function(e){e.stopPropagation();$("logoMenu").classList.toggle("open");tplMenu.classList.remove("open");});
  $("logoUpload").addEventListener("click",function(){$("logoFile").click();});
  $("logoFile").addEventListener("change",function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();
    r.onload=function(){toPng(r.result,560).then(function(o){setLogo(o);$("logoMenu").classList.remove("open");}).catch(function(){alert("No se pudo procesar la imagen. Prueba con PNG o JPG.");});};
    r.readAsDataURL(f);e.target.value="";});
  logoPresets.addEventListener("click",function(e){var b=e.target.closest("[data-logo]");if(!b)return;var d=NP_LOGO_DATA[b.getAttribute("data-logo")];
    if(d){setLogo({dataUrl:d.dataUrl,ar:d.ar});$("logoMenu").classList.remove("open");}});
  $("logoNone").addEventListener("click",function(){setLogo(null);$("logoMenu").classList.remove("open");});

  function openInfo(k){var d=INFO[k]||[k,"Sector personalizado. Define aquí qué parte del ingreso se destina a este concepto."];
    $("modalTitle").textContent=d[0];$("modalBody").innerHTML=d[1].split("\n\n").map(function(p){return "<p>"+escapeHtml(p)+"</p>";}).join("");$("modal").classList.add("open");}
  $("helpBtn").addEventListener("click",function(){openInfo("__how");});
  document.querySelector('[data-info="__income"]').addEventListener("click",function(){openInfo("__income");});
  $("modalX").addEventListener("click",function(){$("modal").classList.remove("open");});
  $("modal").addEventListener("click",function(e){if(e.target===this)this.classList.remove("open");});

  $("chartTypes").addEventListener("click",function(e){var b=e.target.closest("[data-chart]");if(!b)return;chartType=b.getAttribute("data-chart");
    Array.prototype.forEach.call(this.children,function(ch){ch.classList.toggle("active",ch===b);});drawScreenChart();});
  $("showChart").addEventListener("change",function(){state.showChart=this.checked;save();document.querySelector(".chart-box").classList.toggle("off",!this.checked);});
  window.addEventListener("resize",function(){drawScreenChart();});

  $("loadBtn").addEventListener("click",function(){$("loadFile").click();});
  $("loadFile").addEventListener("change",function(e){var f=e.target.files[0];if(!f)return;var r=new FileReader();
    r.onload=function(){try{var wb=XLSX.read(r.result,{type:"binary"});var rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});importRows(rows);}
      catch(err){alert("No se pudo leer el archivo. Usa 'Descargar formato CSV' en el menú de plantillas.");}};
    r.readAsBinaryString(f);});
  function importRows(rows){if(!rows||!rows.length){alert("El archivo está vacío.");return;}
    var h=rows[0].map(function(x){return String(x||"").toLowerCase().trim();});
    var iName=h.findIndex(function(x){return /sector|concepto|nombre|partida/.test(x)&&!/en$/.test(x);});
    var iType=h.findIndex(function(x){return /tipo|type/.test(x);});
    var iVal=h.findIndex(function(x){return /valor|porcentaje|monto|value|amount|%|cantidad/.test(x);});
    var iEn=h.findIndex(function(x){return /(sector|name).*(en)|english|ingl/.test(x);});
    var start=1;if(iName<0){iName=0;iVal=iVal<0?1:iVal;start=0;}
    var out=[];
    for(var k=start;k<rows.length;k++){var rw=rows[k];if(!rw||!rw.length)continue;var name=String(rw[iName]!=null?rw[iName]:"").trim();if(!name)continue;
      var val=parseFloat(String(iVal>=0?rw[iVal]:0).replace(/[^0-9.\-]/g,""))||0;var type="percent";
      if(iType>=0)type=/monto|fijo|fixed|\$/.test(String(rw[iType]).toLowerCase())?"fixed":"percent";else if(val>100)type="fixed";
      out.push({id:uid(),name:name,en:iEn>=0?String(rw[iEn]||"").trim():name,type:type,value:val});}
    if(!out.length){alert("No se encontraron sectores. Revisa el formato (menú Plantillas → Descargar formato CSV).");return;}
    state.sectors=out;save();render();alert("Se cargaron "+out.length+" sectores. Revisa el tipo (% o monto) y el nombre en inglés.");}
  function downloadBlob(blob,name){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();}

  // ── Reporte ──
  function enName(r){return (r.en&&r.en.trim())?r.en.trim():r.name;}
  function dateEn(){var d=new Date(state.date+"T00:00:00");if(isNaN(d))return state.date;return MONTHS_EN[d.getMonth()]+" "+d.getDate()+", "+d.getFullYear();}
  function statusEn(c){return c.rest<-0.005?T.over:(Math.abs(c.rest)<0.005?T.full:T.under);}
  function varPct(dv,prev){if(prev>0)return (dv>=0?"+":"")+(dv/prev*100).toFixed(1)+"%";if(dv!==0)return dv>0?"new":"−100%";return "0.0%";}
  function reportData(){
    var c=compute(),base=compareBase(),head,body;
    if(base){head=[T.sector,T.amount,T.previous,T.variance,T.varpct];
      body=c.rows.map(function(r){var prev=baseAmountFor(r,base),dv=r.amount-prev;return [enName(r),money(r.amount),money(prev),(dv>=0?"+":"−")+money(Math.abs(dv)).replace("-",""),varPct(dv,prev)];});}
    else{head=[T.sector,T.type,T.rate,T.amount,T.pctcol];
      body=c.rows.map(function(r){return [enName(r),r.type==="percent"?T.percent:T.fixed,r.type==="percent"?(r.value+"%"):money(r.value),money(r.amount),r.pct.toFixed(2)+"%"];});}
    return {c:c,base:base,head:head,body:body,ncol:head.length,
      title:(state.company||"Company")+" — "+T.title,
      subtitle:(PERIOD_EN[state.period]||state.period)+" · "+dateEn()+" · "+state.currency+(base?"   ("+T.vslabel+" "+base.label+")":""),
      meta:{company:state.company||"Company",period:PERIOD_EN[state.period]||state.period,date:dateEn(),currency:state.currency,preparer:state.preparer||"—"}};
  }
  function baseName(){return "resource-allocation-"+(state.company||"company").replace(/[^a-z0-9]+/gi,"-").toLowerCase()+"-"+state.date;}
  function bd(rgb){var s={style:"thin",color:{rgb:rgb}};return {top:s,bottom:s,left:s,right:s};}

  function buildXLSX(){
    var d=reportData(),c=d.c,cur=state.currency,base=d.base,wb=XLSX.utils.book_new(),ws={},R=0,merges=[],last=d.ncol-1;
    var fmtMoney='"'+(CURSYM[cur]||"$")+'"#,##0.00',fmtPct='0.00%';
    var C_TITLE={font:{bold:true,sz:16,color:{rgb:"12233F"}}},C_SUB={font:{sz:10,color:{rgb:"64748B"}}};
    var C_K={font:{bold:true,sz:10,color:{rgb:"334155"}}},C_V={font:{sz:11,color:{rgb:"0F172A"}}};
    var C_HEAD={fill:{fgColor:{rgb:"1F345A"}},font:{color:{rgb:"FFFFFF"},bold:true,sz:11},alignment:{horizontal:"center",vertical:"center"},border:bd("2A4A7A")};
    var C_CELL={font:{sz:10,color:{rgb:"0F172A"}},border:bd("D6DEEA")};
    var C_MON={font:{sz:10,color:{rgb:"0F172A"}},border:bd("D6DEEA"),numFmt:fmtMoney,alignment:{horizontal:"right"}};
    var C_PCT={font:{sz:10,color:{rgb:"0F172A"}},border:bd("D6DEEA"),numFmt:fmtPct,alignment:{horizontal:"right"}};
    var C_TOT={font:{bold:true,sz:11,color:{rgb:"12233F"}},fill:{fgColor:{rgb:"E7EEF8"}},border:bd("B9C7DD")};
    var C_TOTM={font:{bold:true,sz:11,color:{rgb:"12233F"}},fill:{fgColor:{rgb:"E7EEF8"}},border:bd("B9C7DD"),numFmt:fmtMoney,alignment:{horizontal:"right"}};
    var C_TOTP={font:{bold:true,sz:11,color:{rgb:"12233F"}},fill:{fgColor:{rgb:"E7EEF8"}},border:bd("B9C7DD"),numFmt:fmtPct,alignment:{horizontal:"right"}};
    function put(r,col,v,t,s){ws[XLSX.utils.encode_cell({r:r,c:col})]={v:v,t:t,s:s};}
    put(R,0,d.title,"s",C_TITLE);merges.push({s:{r:R,c:0},e:{r:R,c:last}});R++;
    put(R,0,d.subtitle,"s",C_SUB);merges.push({s:{r:R,c:0},e:{r:R,c:last}});R+=2;
    [["Company",d.meta.company],["Period",d.meta.period],["Date",d.meta.date],["Currency",d.meta.currency],[T.prepared,d.meta.preparer]].forEach(function(m){put(R,0,m[0],"s",C_K);put(R,1,m[1],"s",C_V);R++;});R++;
    [[T.income,c.inc],[T.assigned,c.assigned],[T.rest,c.rest]].forEach(function(m){put(R,0,m[0],"s",C_K);put(R,1,m[1],"n",{font:C_V.font,numFmt:fmtMoney});R++;});
    put(R,0,T.status,"s",C_K);put(R,1,statusEn(c),"s",C_V);R+=2;
    d.head.forEach(function(hh,i){put(R,i,hh,"s",C_HEAD);});R++;
    if(base){c.rows.forEach(function(r){var prev=baseAmountFor(r,base),dv=r.amount-prev;
        put(R,0,enName(r),"s",C_CELL);put(R,1,+r.amount.toFixed(2),"n",C_MON);put(R,2,+prev.toFixed(2),"n",C_MON);put(R,3,+dv.toFixed(2),"n",C_MON);put(R,4,varPct(dv,prev),"s",{font:C_CELL.font,border:C_CELL.border,alignment:{horizontal:"right"}});R++;});
      var pTot=base.rows.reduce(function(a,b){return a+(b.amount||0);},0),dTot=c.assigned-pTot;
      put(R,0,T.total,"s",C_TOT);put(R,1,+c.assigned.toFixed(2),"n",C_TOTM);put(R,2,+pTot.toFixed(2),"n",C_TOTM);put(R,3,+dTot.toFixed(2),"n",C_TOTM);put(R,4,varPct(dTot,pTot),"s",{font:C_TOT.font,fill:C_TOT.fill,border:C_TOT.border,alignment:{horizontal:"right"}});}
    else{c.rows.forEach(function(r){put(R,0,enName(r),"s",C_CELL);put(R,1,r.type==="percent"?T.percent:T.fixed,"s",C_CELL);put(R,2,r.type==="percent"?(r.value+"%"):money(r.value),"s",C_CELL);put(R,3,+r.amount.toFixed(2),"n",C_MON);put(R,4,c.inc>0?r.amount/c.inc:0,"n",C_PCT);R++;});
      put(R,0,T.total,"s",C_TOT);put(R,1,"","s",C_TOT);put(R,2,"","s",C_TOT);put(R,3,+c.assigned.toFixed(2),"n",C_TOTM);put(R,4,c.inc>0?c.assigned/c.inc:0,"n",C_TOTP);}
    ws["!ref"]=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:R,c:last}});
    ws["!cols"]=base?[{wch:30},{wch:18},{wch:18},{wch:18},{wch:12}]:[{wch:30},{wch:16},{wch:14},{wch:18},{wch:14}];
    ws["!merges"]=merges;XLSX.utils.book_append_sheet(wb,ws,"Allocation");return wb;
  }
  function exportXLSX(){XLSX.writeFile(buildXLSX(),baseName()+".xlsx");}

  var PDF_IMG_W=1000,PDF_IMG_H=384; // AR de la imagen de gráfica del PDF (para colocarla sin deformar)
  function buildPDF(){
    var d=reportData(),c=d.c,jsPDF=window.jspdf.jsPDF,doc=new jsPDF(),PW=210,logo=state.logo;
    // ═══ Encabezado (información directa, sin portada) ═══
    doc.setFillColor(15,23,42);doc.rect(0,0,PW,30,"F");
    if(logo&&logo.dataUrl){var lh=Math.min(13,52/logo.ar),lw=lh*logo.ar,pad=2.2,bx=PW-14-lw-pad*2,by=15-(lh+pad*2)/2;
      doc.setFillColor(255,255,255);doc.roundedRect(bx,by,lw+pad*2,lh+pad*2,1.6,1.6,"F");
      try{doc.addImage(logo.dataUrl,"PNG",bx+pad,by+pad,lw,lh);}catch(e){}}
    doc.setTextColor(255);doc.setFont(undefined,"bold");doc.setFontSize(15);doc.text(d.meta.company,14,15,{maxWidth:PW-70});
    doc.setTextColor(150,175,220);doc.setFontSize(9.5);doc.setFont(undefined,"normal");doc.text(T.title.toUpperCase()+"  ·  "+d.subtitle,14,22,{maxWidth:PW-70});
    // Resumen
    var cy=40,cw=(PW-28-16)/3;
    [[T.income,money(c.inc),[79,156,249]],[T.assigned,money(c.assigned),[52,211,153]],[T.rest,money(c.rest),c.rest<-0.005?[248,113,113]:[100,116,139]]].forEach(function(cd,i){var x=14+i*(cw+8);
      doc.setDrawColor(220,228,240);doc.setFillColor(247,250,253);doc.roundedRect(x,cy,cw,20,2,2,"FD");
      doc.setTextColor(100,116,139);doc.setFontSize(7.5);doc.text(cd[0].toUpperCase(),x+4,cy+6);
      doc.setTextColor(cd[2][0],cd[2][1],cd[2][2]);doc.setFont(undefined,"bold");doc.setFontSize(12);doc.text(cd[1],x+4,cy+14);doc.setFont(undefined,"normal");});
    doc.setTextColor(100,116,139);doc.setFontSize(9);doc.text(T.status+": "+statusEn(c),14,cy+27);
    // Gráfica (opcional) — colocada respetando su proporción real (dona redonda, no achatada)
    var startY=cy+33;
    if(state.showChart!==false){var img=chartExportImage(chartType,PDF_IMG_W,PDF_IMG_H);
      if(img){var iw=PW-28,ih=iw*PDF_IMG_H/PDF_IMG_W;try{doc.addImage(img,"PNG",14,startY,iw,ih);startY+=ih+7;}catch(e){startY+=4;}}else startY+=4;}
    else startY+=2;
    var foot;
    if(d.base){var pTot=d.base.rows.reduce(function(a,b){return a+(b.amount||0);},0),dTot=c.assigned-pTot;foot=[[T.total,money(c.assigned),money(pTot),(dTot>=0?"+":"−")+money(Math.abs(dTot)).replace("-",""),varPct(dTot,pTot)]];}
    else foot=[[T.total,"","",money(c.assigned),(c.inc>0?(c.assigned/c.inc*100):0).toFixed(2)+"%"]];
    doc.autoTable({head:[d.head],body:d.body,foot:foot,startY:startY,theme:"grid",
      headStyles:{fillColor:[31,52,90],textColor:255,fontStyle:"bold",fontSize:9},footStyles:{fillColor:[231,238,248],textColor:[18,35,63],fontStyle:"bold"},
      styles:{fontSize:8.5,cellPadding:2.2},alternateRowStyles:{fillColor:[246,249,253]},
      columnStyles:d.base?{1:{halign:"right"},2:{halign:"right"},3:{halign:"right"},4:{halign:"right"}}:{3:{halign:"right"},4:{halign:"right"}},
      didDrawPage:function(){var h=doc.internal.pageSize.getHeight();doc.setDrawColor(220,228,240);doc.line(14,h-14,PW-14,h-14);
        doc.setFontSize(8);doc.setTextColor(120,130,150);doc.text(T.prepared+": "+d.meta.preparer+"  ·  "+d.meta.date,14,h-9);doc.text("Page "+doc.internal.getNumberOfPages(),PW-14,h-9,{align:"right"});}});
    return doc;
  }
  function exportPDF(){buildPDF().save(baseName()+".pdf");}

  function buildTXT(){
    var d=reportData(),c=d.c;
    function pad(s,n,r){s=String(s);if(s.length>n)s=s.slice(0,n-1)+"…";return r?(" ".repeat(Math.max(0,n-s.length))+s):(s+" ".repeat(Math.max(0,n-s.length)));}
    var W=76,line="+"+"-".repeat(W-2)+"+",L=[];
    L.push(line);L.push("| "+pad(d.meta.company,W-4)+" |");L.push("| "+pad(T.title+" — "+d.subtitle,W-4)+" |");L.push(line);L.push("");
    L.push("SUMMARY");
    L.push("  "+pad(T.income+":",22)+money(c.inc));L.push("  "+pad(T.assigned+":",22)+money(c.assigned));L.push("  "+pad(T.rest+":",22)+money(c.rest));
    L.push("  "+pad(T.status+":",22)+statusEn(c));L.push("  "+pad(T.prepared+":",22)+d.meta.preparer);L.push("");
    var widths=d.base?[26,15,15,10,10]:[26,13,9,16,10],hdr="";d.head.forEach(function(hh,i){hdr+=pad(hh,widths[i],i>=1);});L.push(hdr);L.push("-".repeat(W));
    d.body.forEach(function(row){var s2="";row.forEach(function(cell,i){s2+=pad(cell,widths[i],i>=1);});L.push(s2);});L.push("-".repeat(W));
    if(d.base){var pTot=d.base.rows.reduce(function(a,b){return a+(b.amount||0);},0),dTot=c.assigned-pTot;
      L.push(pad(T.total,widths[0])+pad(money(c.assigned),widths[1],true)+pad(money(pTot),widths[2],true)+pad((dTot>=0?"+":"−")+money(Math.abs(dTot)).replace("-",""),widths[3],true)+pad(varPct(dTot,pTot),widths[4],true));}
    else L.push(pad(T.total,widths[0])+pad("",widths[1],true)+pad("",widths[2],true)+pad(money(c.assigned),widths[3],true)+pad((c.inc>0?(c.assigned/c.inc*100):0).toFixed(2)+"%",widths[4],true));
    return L.join("\n");
  }
  function exportTXT(){downloadBlob(new Blob([buildTXT()],{type:"text/plain"}),baseName()+".txt");}

  function buildWordInner(){
    var d=reportData(),c=d.c,img=(state.showChart!==false)?chartExportImage():null;
    var rows=d.body.map(function(r){return "<tr>"+r.map(function(x,i){return "<td style='border:1px solid #ccc;padding:6px;"+((d.base&&i>=1)||(!d.base&&i>=3)?"text-align:right;":"")+"'>"+x+"</td>";}).join("")+"</tr>";}).join("");
    var totCells;
    if(d.base){var pTot=d.base.rows.reduce(function(a,b){return a+(b.amount||0);},0),dTot=c.assigned-pTot;
      totCells="<td style='border:1px solid #ccc;padding:6px'>"+T.total+"</td><td style='border:1px solid #ccc;padding:6px;text-align:right'>"+money(c.assigned)+"</td><td style='border:1px solid #ccc;padding:6px;text-align:right'>"+money(pTot)+"</td><td style='border:1px solid #ccc;padding:6px;text-align:right'>"+(dTot>=0?"+":"−")+money(Math.abs(dTot)).replace("-","")+"</td><td style='border:1px solid #ccc;padding:6px;text-align:right'>"+varPct(dTot,pTot)+"</td>";}
    else totCells="<td style='border:1px solid #ccc;padding:6px' colspan='3'>"+T.total+"</td><td style='border:1px solid #ccc;padding:6px;text-align:right'>"+money(c.assigned)+"</td><td style='border:1px solid #ccc;padding:6px;text-align:right'>"+(c.inc>0?(c.assigned/c.inc*100):0).toFixed(2)+"%</td>";
    return "<div style='background:#0F172A;color:#fff;padding:14px'><div style='font-size:18px;font-weight:bold'>"+d.meta.company+"</div><div style='font-size:12px;color:#96AFDC'>"+T.title+" · "+d.subtitle+"</div></div>"
      +"<h3>Summary</h3><p><b>"+T.income+":</b> "+money(c.inc)+"<br><b>"+T.assigned+":</b> "+money(c.assigned)+"<br><b>"+T.rest+":</b> "+money(c.rest)+"<br><b>"+T.status+":</b> "+statusEn(c)+"<br><b>"+T.prepared+":</b> "+d.meta.preparer+"</p>"
      +(img?"<p><img src='"+img+"' style='width:540px;max-width:100%'/></p>":"")
      +"<table style='border-collapse:collapse;width:100%'><thead><tr>"+d.head.map(function(x){return "<th style='border:1px solid #ccc;padding:6px;background:#1F345A;color:#fff'>"+x+"</th>";}).join("")+"</tr></thead><tbody>"+rows+"<tr style='background:#E7EEF8;font-weight:bold'>"+totCells+"</tr></tbody></table>";
  }
  function exportWord(){
    var html="<html><head><meta charset='utf-8'></head><body style='font-family:Arial;color:#0F172A'>"+buildWordInner()+"</body></html>";
    downloadBlob(new Blob([html],{type:"application/msword"}),baseName()+".doc");
  }

  function buildPPTX(){
    var d=reportData(),c=d.c,logo=state.logo,pptx=new PptxGenJS();pptx.defineLayout({name:"W",width:10,height:5.625});pptx.layout="W";
    var BG="0A0F1E",SURF="111A30",BLUE="4F9CF9",MINT="34D399",TX="E6ECF7",T2="94A3C4";
    // ── Slide 1: portada ──
    var s1=pptx.addSlide();s1.background={color:BG};
    s1.addShape(pptx.ShapeType.rect,{x:0,y:0,w:10,h:0.14,fill:{color:BLUE}});
    s1.addShape(pptx.ShapeType.rect,{x:0,y:5.485,w:10,h:0.14,fill:{color:BLUE}});
    if(logo&&logo.dataUrl){var lw=Math.min(3.2,1.5*logo.ar),lh=lw/logo.ar;if(lh>1.5){lh=1.5;lw=lh*logo.ar;}s1.addImage({data:logo.dataUrl,x:(10-lw)/2,y:1.0,w:lw,h:lh});}
    s1.addText(d.meta.company,{x:0.5,y:2.7,w:9,h:0.6,align:"center",fontSize:26,bold:true,color:TX});
    s1.addText(T.title.toUpperCase(),{x:0.5,y:3.35,w:9,h:0.4,align:"center",fontSize:14,color:BLUE,charSpacing:2});
    s1.addText(d.meta.period+"   ·   "+d.meta.date+"   ·   "+d.meta.currency,{x:0.5,y:3.85,w:9,h:0.35,align:"center",fontSize:12,color:T2});
    s1.addText(T.prepared+": "+d.meta.preparer,{x:0.5,y:4.85,w:9,h:0.3,align:"center",fontSize:11,color:"5F6E90"});
    // ── Slide 2: contenido ──
    var s2=pptx.addSlide();s2.background={color:BG};
    if(logo&&logo.dataUrl){s2.addShape(pptx.ShapeType.roundRect,{x:8.55,y:0.28,w:1.15,h:0.62,rectRadius:0.05,fill:{color:"FFFFFF"}});
      var hw=1.0,hh=hw/logo.ar;if(hh>0.5){hh=0.5;hw=hh*logo.ar;}s2.addImage({data:logo.dataUrl,x:8.55+(1.15-hw)/2,y:0.28+(0.62-hh)/2,w:hw,h:hh});}
    s2.addText(d.meta.company,{x:0.4,y:0.3,w:7.9,h:0.4,fontSize:18,bold:true,color:TX});
    s2.addText(T.title+" · "+d.subtitle,{x:0.4,y:0.72,w:8,h:0.3,fontSize:11,color:T2});
    // métricas en 3 cajas
    var mets=[[T.income,money(c.inc),BLUE],[T.assigned,money(c.assigned),MINT],[T.rest,money(c.rest),c.rest<-0.005?"F87171":"94A3C4"]];
    mets.forEach(function(m,i){var x=0.4+i*3.12;s2.addShape(pptx.ShapeType.roundRect,{x:x,y:1.25,w:2.9,h:0.85,rectRadius:0.06,fill:{color:SURF},line:{color:"24345A",width:1}});
      s2.addText(m[0].toUpperCase(),{x:x+0.15,y:1.33,w:2.6,h:0.25,fontSize:8,color:T2,charSpacing:1});
      s2.addText(m[1],{x:x+0.15,y:1.58,w:2.6,h:0.4,fontSize:15,bold:true,color:m[2]});});
    // tabla (izquierda) + gráfica (derecha), proporcionadas
    var head=d.head.map(function(x){return {text:x,options:{bold:true,color:"FFFFFF",fill:"1F345A"}};});
    var bodyRows=d.body.map(function(r){return r.map(function(cl,ci){return {text:String(cl),options:{color:TX,align:ci>=(d.base?1:3)?"right":"left"}};});});
    var tRows=[head].concat(bodyRows);
    var showC=state.showChart!==false;
    s2.addTable(tRows,{x:0.4,y:2.35,w:showC?5.35:9.2,rowH:0.32,fontSize:9,valign:"middle",border:{pt:0.5,color:"24345A"},fill:{color:SURF},color:TX});
    if(showC){var img=chartExportImage("doughnut",760,620);if(img){s2.addImage({data:img,x:6.0,y:2.35,w:3.6,h:3.6*620/760});}}
    s2.addText(T.status+": "+statusEn(c)+"   ·   "+T.prepared+": "+d.meta.preparer,{x:0.4,y:5.15,w:9,h:0.3,fontSize:9,color:"5F6E90"});
    return pptx;
  }
  function exportPPTX(){buildPPTX().writeFile({fileName:baseName()+".pptx"});}

  function buildMD(){
    var d=reportData(),c=d.c;
    return "# "+d.meta.company+"\n### "+T.title+"\n\n**"+d.subtitle+"**\n\n"
      +"| Metric | Value |\n|---|---|\n| "+T.income+" | "+money(c.inc)+" |\n| "+T.assigned+" | "+money(c.assigned)+" |\n| "+T.rest+" | "+money(c.rest)+" |\n| "+T.status+" | "+statusEn(c)+" |\n| "+T.prepared+" | "+d.meta.preparer+" |\n\n"
      +"| "+d.head.join(" | ")+" |\n|"+d.head.map(function(){return "---";}).join("|")+"|\n"+d.body.map(function(r){return "| "+r.join(" | ")+" |";}).join("\n")+"\n";
  }
  function exportMD(){downloadBlob(new Blob([buildMD()],{type:"text/markdown"}),baseName()+".md");}

  function exportZIP(){
    if(typeof JSZip==="undefined"){alert("La librería de compresión aún no cargó. Espera unos segundos y prueba de nuevo.");return;}
    var zip=new JSZip(),bn=baseName();
    try{zip.file(bn+".xlsx",XLSX.write(buildXLSX(),{type:"array",bookType:"xlsx"}));}catch(e){}
    try{zip.file(bn+".pdf",buildPDF().output("arraybuffer"));}catch(e){}
    try{zip.file(bn+".txt",buildTXT());}catch(e){}
    var img=chartExportImage();if(img){try{zip.file(bn+"-chart.png",img.split(",")[1],{base64:true});}catch(e){}}
    zip.generateAsync({type:"blob"}).then(function(blob){downloadBlob(blob,bn+".zip");}).catch(function(){alert("No se pudo crear el .zip.");});
  }

  document.querySelector(".export__grid").addEventListener("click",function(e){var b=e.target.closest("[data-export]");if(!b)return;var k=b.getAttribute("data-export");
    try{if(k==="xlsx")exportXLSX();else if(k==="pdf")exportPDF();else if(k==="word")exportWord();else if(k==="pptx")exportPPTX();else if(k==="md")exportMD();else if(k==="txt")exportTXT();}
    catch(err){alert("No se pudo exportar a "+k+". Si acabas de abrir la página, espera unos segundos a que carguen las librerías y prueba de nuevo.");}});
  $("zipBtn").addEventListener("click",exportZIP);
  $("exportToggle").addEventListener("click",function(){$("exportPanel").classList.toggle("open");});

  // ══ VISOR / VISTA PREVIA ══
  var pvFmt="pdf";
  var PV_LABEL={pdf:"Descargar PDF",word:"Descargar Word",txt:"Descargar Texto",md:"Descargar Markdown"};
  function clearPvUrl(){var f=$("pvBody").querySelector("iframe");if(f&&f.src&&f.src.indexOf("blob:")===0){try{URL.revokeObjectURL(f.src);}catch(e){}}}
  function renderPreview(){
    var body=$("pvBody");clearPvUrl();body.innerHTML="";
    Array.prototype.forEach.call($("pvTabs").children,function(t){t.classList.toggle("active",t.getAttribute("data-pv")===pvFmt);});
    $("pvDownload").textContent=PV_LABEL[pvFmt]||"Descargar";$("pvNote").textContent="";
    if(pvFmt==="pdf"){
      try{var url=buildPDF().output("bloburl");var f=document.createElement("iframe");f.src=url;body.appendChild(f);
        $("pvNote").textContent="Así se verá el PDF. Ajusta los datos en el panel y pulsa Actualizar.";}
      catch(e){body.innerHTML='<div class="pv__msg">La vista de PDF necesita conexión a internet (la librería del PDF se carga desde la web). Ábrelo en tu navegador con internet.<br><br>Mientras tanto, puedes previsualizar en <b>Word</b>, <b>Texto</b> o <b>Markdown</b>, que funcionan sin conexión.</div>';}
    }else if(pvFmt==="word"){
      var paper=document.createElement("div");paper.className="pv__paper";paper.innerHTML=buildWordInner();body.appendChild(paper);
      $("pvNote").textContent="Vista aproximada del documento Word.";
    }else if(pvFmt==="txt"){
      var ta=document.createElement("textarea");ta.className="pv__text";ta.id="pvEdit";ta.value=buildTXT();body.appendChild(ta);
      $("pvNote").textContent="Puedes editar el texto aquí antes de descargarlo.";
    }else if(pvFmt==="md"){
      var ta2=document.createElement("textarea");ta2.className="pv__text";ta2.id="pvEdit";ta2.value=buildMD();body.appendChild(ta2);
      $("pvNote").textContent="Puedes editar el Markdown aquí antes de descargarlo.";
    }
  }
  function openPreview(){$("preview").classList.add("open");document.body.style.overflow="hidden";renderPreview();}
  function closePreview(){clearPvUrl();$("preview").classList.remove("open");document.body.style.overflow="";}
  $("openPreview").addEventListener("click",openPreview);
  $("pvX").addEventListener("click",closePreview);
  $("preview").addEventListener("click",function(e){if(e.target===this)closePreview();});
  $("pvRefresh").addEventListener("click",renderPreview);
  $("pvTabs").addEventListener("click",function(e){var b=e.target.closest("[data-pv]");if(!b)return;pvFmt=b.getAttribute("data-pv");renderPreview();});
  $("pvDownload").addEventListener("click",function(){
    try{
      if(pvFmt==="pdf")exportPDF();
      else if(pvFmt==="word")exportWord();
      else if(pvFmt==="txt"){var t=$("pvEdit")?$("pvEdit").value:buildTXT();downloadBlob(new Blob([t],{type:"text/plain"}),baseName()+".txt");}
      else if(pvFmt==="md"){var m=$("pvEdit")?$("pvEdit").value:buildMD();downloadBlob(new Blob([m],{type:"text/markdown"}),baseName()+".md");}
    }catch(err){alert("No se pudo generar el archivo. Si acabas de abrir la página, espera a que carguen las librerías (necesitan internet) y prueba de nuevo.");}
  });
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&$("preview").classList.contains("open"))closePreview();});

  load();render();
})();
