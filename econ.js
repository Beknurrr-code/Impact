// Экономика IMPACT (гипотеза, кроме источников рынка). Рендер в #econ.
(function(){const el=document.getElementById('econ');if(!el)return;
const H='',f=n=>n.toLocaleString('ru-RU');
const fun=[[113,'Заводы, обязанные ставить АСМ'],[60,'Контакт'],[20,'Встреча'],[6,'Пилот'],[3,'Платящий клиент']];
const yrs=[[1,3,2.7,.54,1.44,.72],[2,8,9.9,1.98,2.4,5.52],[3,15,20.7,4.14,3.36,13.2]];
el.innerHTML=`<style>
#econ{--ea:#0033CC}#econ .eg{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}#econ .ec{border:1px solid rgba(127,127,127,.3);border-radius:14px;padding:18px}
#econ h3{font-family:'Instrument Serif',serif;font-weight:400;font-size:28px;margin:0 0 10px}#econ .eh{font-size:10px;letter-spacing:.12em;text-transform:uppercase;border:1px solid currentColor;border-radius:999px;padding:1px 7px;opacity:.7;margin-left:6px;vertical-align:middle}
#econ table{width:100%;border-collapse:collapse;font-size:13px}#econ td,#econ th{padding:6px 6px 6px 0;border-bottom:1px solid rgba(127,127,127,.25);text-align:left}#econ th{font-weight:500;opacity:.65}
#econ .fn div{background:var(--ea);color:#fff;margin:4px auto;padding:6px 10px;border-radius:6px;font-size:13px;text-align:center}
#econ .bars{display:flex;gap:18px;align-items:flex-end;height:170px;margin:10px 0}#econ .bars>div{flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-size:11px}
#econ .bars i{display:block;width:100%;border-radius:4px 4px 0 0}#econ .lg i{display:inline-block;width:10px;height:10px;margin:0 4px 0 10px;border-radius:2px}
#econ input[type=range]{width:100%}#econ .cv{font-family:'Instrument Serif',serif;font-size:34px}#econ .bad{color:#D9483B}#econ .warn{background:#D9483B;color:#fff;padding:6px 10px;border-radius:8px;font-size:13px;margin-top:8px}
#econ a{color:inherit}</style>
<div class="eg">
<div class="ec"><h3>Модель</h3><p>SaaS: завод платит <b>150 000 ₸/мес</b> за площадку ${H}. Программа поверх существующих датчиков (CSV/API), оборудование — через партнёров.</p></div>
<div class="ec"><h3>Рынок</h3><table><tr><td>Потолок</td><td>718 × 150 000 × 12 = <b>1,29 млрд ₸/год</b><br><a href="https://unece.org/sites/default/files/2024-12/6_Kazakhstan.pdf" target="_blank" style="font-size:11px;opacity:.7">718 предприятий — ЕЭК ООН</a></td></tr>
<tr><td>Доступный</td><td>113 × 150 000 × 12 = <b>203,4 млн ₸/год</b><br><a href="https://ortcom.kz/en/press-relizy/1790762235" target="_blank" style="font-size:11px;opacity:.7">113 заводов — Минэкологии РК</a></td></tr></table><p style="font-size:11px;opacity:.6">Цена 150 000 ₸ — гипотеза. Цель года 3: 15 из 113 ≈ 13% доступного рынка ${H}.</p></div>
<div class="ec"><h3>Воронка, год 1 ${H}</h3><div class="fn">${fun.map(([n,t])=>`<div style="width:${30+70*n/113}%">${n} · ${t}</div>`).join('')}</div></div>
</div><div class="eg" style="margin-top:16px">
<div class="ec"><h3>Юнит-экономика ${H}</h3><table>
<tr><td>Цена</td><td>150 000 ₸/мес</td></tr><tr><td>COGS</td><td>30 000 ₸ (хостинг 5 000, API 5 000, поддержка 20 000)</td></tr>
<tr><td>Маржа</td><td><b>120 000 ₸ (80%)</b></td></tr><tr><td>CAC</td><td><b>480 000 ₸</b> — включает время команды, выезды на площадку и пилот</td></tr>
<tr><td>LTV</td><td>1 440 000 ₸ (12 мес × 120 000)</td></tr><tr><td>LTV/CAC</td><td><b>3,0</b></td></tr><tr><td>Окупаемость</td><td>4 мес (480 000 / 120 000)</td></tr><tr><td>Чувствительность</td><td>срок жизни 24 мес → LTV/CAC 6,0; CAC 720 000 ₸ → 2,0</tr></table></div>
<div class="ec"><h3>3 года ${H}</h3><div class="bars">${yrs.map(y=>`<div><div style="display:flex;gap:3px;align-items:flex-end;width:100%;height:140px"><i style="height:${y[2]/20.7*140}px;background:var(--ea)"></i><i style="height:${y[3]/20.7*140}px;background:#E8833A"></i><i style="height:${y[4]/20.7*140}px;background:#8A8A86"></i><i style="height:${y[5]/20.7*140}px;background:#3FAE6A"></i></div>Год ${y[0]}</div>`).join('')}</div>
<div class="lg" style="font-size:11px"><i style="background:var(--ea)"></i>выручка<i style="background:#E8833A"></i>COGS<i style="background:#8A8A86"></i>привлечение<i style="background:#3FAE6A"></i>остаток</div>
<table style="margin-top:10px"><tr><th>млн ₸</th><th>Год 1</th><th>Год 2</th><th>Год 3</th></tr><tr><td>Клиенты</td>${yrs.map(y=>`<td>${y[1]}</td>`).join('')}</tr>
<tr><td>Выручка</td>${yrs.map(y=>`<td>${String(y[2]).replace('.',',')}</td>`).join('')}</tr><tr><td>COGS</td>${yrs.map(y=>`<td>${String(y[3]).replace('.',',')}</td>`).join('')}</tr>
<tr><td>Привлечение</td>${yrs.map(y=>`<td>${String(y[4]).replace('.',',')}</td>`).join('')}</tr><tr><td><b>Остаток</b></td>${yrs.map(y=>`<td><b>${String(y[5]).replace('.',',')}</b></td>`).join('')}</tr></table><p style="font-size:11px;opacity:.65;margin-top:8px">Новые клиенты в год подписания платят в среднем полгода; цикл сделки 6–9 мес. Остаток = выручка − COGS − привлечение.</p></div>
<div class="ec"><h3>Калькулятор ${H}</h3>
<label>Цена, ₸/мес: <b id="vP"></b><input type="range" id="sP" min="50000" max="300000" step="5000" value="150000"></label>
<label>CAC, ₸: <b id="vC"></b><input type="range" id="sC" min="50000" max="1500000" step="10000" value="480000"></label>
<label>COGS, ₸/мес: <b id="vG"></b><input type="range" id="sG" min="0" max="150000" step="1000" value="30000"></label>
<label>Срок жизни клиента, мес: <b id="vL"></b><input type="range" id="sL" min="1" max="48" step="1" value="12"></label>
<div class="eg" style="grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><div>Маржа<div class="cv" id="oM"></div></div><div>LTV<div class="cv" id="oL"></div></div><div>LTV/CAC<div class="cv" id="oR"></div></div><div>Окупаемость<div class="cv" id="oB"></div></div></div><div id="oW"></div></div>
</div>
<div class="ec" style="margin-top:16px"><h3>Риски</h3><p>LTV/CAC = 3,0 при сроке жизни 12 мес — нижняя граница нормы; при 24 мес — 6,0; если CAC вырастет до 720 000 ₸ — 2,0, модель не проходит. Основная задача пилотов — удержание клиента дольше года. Зарплаты основателей в CAC не включены. Все цифры, кроме размера рынка (источники выше), — гипотеза, проверяем на пилотах.</p></div>`;
const g=id=>document.getElementById(id);
function calc(){const P=+g('sP').value,C=+g('sC').value,G=+g('sG').value,L=+g('sL').value,M=P-G,LTV=M*L,R=C>0?LTV/C:0;
 g('vP').textContent=f(P);g('vC').textContent=f(C);g('vG').textContent=f(G);g('vL').textContent=L;
 g('oM').textContent=f(M)+' ₸ ('+Math.round(100*M/P)+'%)';g('oL').textContent=f(LTV)+' ₸';g('oR').textContent=R.toFixed(1).replace('.',',');g('oR').className='cv'+(R<=3?' bad':'');
 g('oB').textContent=M>0?(C/M).toFixed(1).replace('.',',')+' мес':'—';
 g('oW').innerHTML=M<=0?'<div class="warn">Маржа ≤ 0 — модель не работает</div>':R<=1?'<div class="warn">LTV ≤ CAC — автоматическое последнее место</div>':R<=3?'<div class="warn" style="background:#E8833A">LTV/CAC ≤ 3 — ниже нормы</div>':'';}
['sP','sC','sG','sL'].forEach(i=>g(i).oninput=calc);calc();})();
