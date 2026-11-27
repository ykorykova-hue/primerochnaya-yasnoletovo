const form = document.querySelector('#fit-form');
const result = document.querySelector('#result');
const formatRubles = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
});
const homes = [
  { name: 'Готовый дом в КП «Яснолетово» · Московский тракт', price: 14088800, bedrooms: 3, anchor: 'title', build: false },
  { name: 'SHiLO 124 · Зелёные кварталы · Тюменский тракт', price: 12700000, bedrooms: 3, anchor: 'shilo', build: true },
  { name: 'Готовый дом в КП «Лесные улочки» · п. Бобровский', price: 16000000, bedrooms: 3, anchor: 'lesnye', build: false, repair: true },
  { name: 'HELEN HOUSE 120 в КП КраСоты', price: 27100000, bedrooms: 3, anchor: 'helen', build: false, finished: true },
  { name: 'Дом-шале 146,8 м², с. Патруши', price: 13900000, bedrooms: 3, anchor: 'polyana', build: false, finished: true },
  { name: 'BARNHOUSE 130, 149 м² · КП «КраСоты» · 2 км от Двуреченска', price: 14500000, bedrooms: 3, anchor: 'barnhouse', build: false, finished: true },
  { name: 'Дом 136 м² в КП Европа, Берёзовский', price: 14000000, bedrooms: 3, anchor: 'europa', build: false },
  { name: 'Дом 180 м² · Зелёные кварталы · Тюменский тракт', price: 13400000, bedrooms: 3, anchor: 'green180', build: false },
  { name: 'Дом М3, 140 м² · Рассоха Парк · Тюменский тракт', price: 12700000, bedrooms: 3, anchor: 'rassoha', build: false, repair: true },
  { name: 'Дом в посёлке Бобровский', price: 8000000, bedrooms: 2, anchor: 'bobrovsky', build: false, finished: true, finishLabel: 'под ключ' },
  { name: 'Дом 115 м² в квартале Гранат, КП Заповедник', price: 17800000, bedrooms: 3, anchor: 'granat', build: false, finished: true, finishLabel: 'дизайнерский ремонт', gas: true },
  { name: 'Дом 153 м² · Зелёные Кварталы · Тюменский тракт · 2-я очередь', price: 12200000, bedrooms: 4, anchor: 'zk153', build: false },
  { name: 'Дом 198,3 м² с гаражом · Зелёные Кварталы · Тюменский тракт', price: 13490000, bedrooms: 4, anchor: 'zk198', build: false }
];

const rassohaOfferEnds = new Date('2026-12-16T00:00:00+05:00');
if (new Date() >= rassohaOfferEnds) {
 document.querySelector('#rassoha-price').textContent = 'Цена по запросу';
 document.querySelector('#rassoha-offer').hidden = true;
}

const promotionEnds = new Date('2027-01-01T00:00:00+05:00');
const lesnyeOfferEnds = new Date('2026-12-01T00:00:00+05:00');
if (new Date() >= lesnyeOfferEnds) document.querySelector('#lesnye-offer').hidden = true;

if (new Date() >= promotionEnds) {
  document.querySelector('#shilo-price').textContent = 'Цена по запросу';
  document.querySelector('#promo-status').textContent = 'Срок акции завершился.';
  document.querySelector('#promo-terms').hidden = true;
}

function budgetPrice(home, today) {
  return (home.build && today >= promotionEnds) || (home.anchor === 'rassoha' && today >= rassohaOfferEnds) ? null : home.price;
}

function compareHome(home, preferences, today) {
  const price = budgetPrice(home, today);
  const differences = [];
  const unknowns = [];
  if (price === null) unknowns.push(home.price === null
    ? 'Цену нужно уточнить.'
    : 'Срок акции прошёл. Текущую цену нужно уточнить.');
  if (price !== null && preferences.budget < price) {
    differences.push(`Выше вашего бюджета на ${formatRubles.format(price - preferences.budget)}.`);
  }
  if (home.repair && preferences.moveIn === 'now') {
    unknowns.push('Дату готовности к заселению нужно уточнить.');
  }
  if (!home.repair && !home.finished && !home.readinessUnknown && preferences.moveIn === 'now') {
    differences.push(home.build
      ? 'Потребуются строительство и чистовая отделка.'
      : 'Перед переездом потребуется чистовая отделка.');
  }
  if (home.readinessUnknown && preferences.moveIn === 'now') unknowns.push('Готовность к заселению нужно уточнить.');
  if (preferences.gas && !home.gas) unknowns.push('Наличие газа нужно уточнить.');
  return { home, price, differences, unknowns };
}

function areaValue(home, type) {
  const facts = document.getElementById(home.anchor).querySelectorAll(':scope > .facts > div');
  const row = Array.from(facts).find((fact) => {
    const label = fact.querySelector('dt').textContent.trim();
    return type === 'house' ? label.startsWith('Площадь') : label === 'Участок';
  });
  return Number.parseFloat(row?.querySelector('dd').textContent.replace(',', '.'));
}

function areaRange(type) {
  return [
    form.querySelector(`#${type}-area-min`).valueAsNumber,
    form.querySelector(`#${type}-area-max`).valueAsNumber
  ];
}

function withinArea(value, [min, max]) {
  return (!Number.isFinite(min) || value >= min) && (!Number.isFinite(max) || value <= max);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const preferences = {
    budget: form.querySelector('#budget').valueAsNumber,
    bedrooms: Number(form.querySelector('#rooms').value),
    moveIn: form.querySelector('#finish').value,
    gas: form.querySelector('#gas').checked
  };
  const houseArea = areaRange('house');
  const plotArea = areaRange('plot');
  result.replaceChildren();
  result.hidden = false;
  if (houseArea[0] > houseArea[1] || plotArea[0] > plotArea[1]) {
    result.textContent = 'Проверьте диапазон площади. Значение «От» должно быть меньше или равно «До».';
    return;
  }
  const today = new Date();
  const matches = homes
    .filter((home) => home.bedrooms >= preferences.bedrooms
      && withinArea(areaValue(home, 'house'), houseArea)
      && withinArea(areaValue(home, 'plot'), plotArea))
    .map((home) => compareHome(home, preferences, today))
    .sort((a, b) => a.differences.length - b.differences.length || a.unknowns.length - b.unknowns.length);
  if (!matches.length) {
    result.textContent = 'Домов с выбранной площадью и количеством спален пока нет.';
    return;
  }
  const columns = ['Дом', 'Цена', 'Площадь дома', 'Участок', 'Отделка', 'Спален', 'Санузлов', 'Подробности'];
  const table = document.createElement('table');
  table.className = 'comparison-table';
  table.createCaption().textContent = `Найдено домов: ${matches.length}`;
  const header = table.createTHead().insertRow();
  for (const column of columns) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = column;
    header.append(cell);
  }
  const body = table.createTBody();
  for (const { home, price, differences, unknowns } of matches) {
    const facts = Array.from(document.getElementById(home.anchor).querySelectorAll(':scope > .facts > div'));
    const row = document.createElement('tr');
    const title = document.createElement('th');
    title.scope = 'row';
    title.textContent = home.name;
    row.append(title);
    const priceLabel = price === null ? 'Цена по запросу' : formatRubles.format(price);
    const values = [priceLabel, ...facts.map((fact) => {
      const value = fact.querySelector('dd').textContent.trim();
      return fact.querySelector('dt').textContent.includes('террасой и крыльцом')
        ? value + ' с террасой и крыльцом' : value;
    })];
    values.forEach((value, index) => {
      const cell = document.createElement('td');
      const label = document.createElement('span');
      label.className = 'comparison-mobile-label';
      label.setAttribute('aria-hidden', 'true');
      label.textContent = columns[index + 1];
      cell.append(label, value);
      row.append(cell);
    });
    const actions = document.createElement('td');
    actions.className = 'comparison-actions';
    const notes = [...differences, ...unknowns];
    if (home.build) notes.unshift(price === null ? 'Под строительство.' : 'Под строительство, цена по акции.');
    if (home.repair && home.anchor === 'rassoha') notes.push('Срок отделки по согласованию.');
    if (!notes.length) notes.push('Подходит по выбранным параметрам.');
    for (const note of notes) {
      const paragraph = document.createElement('p');
      paragraph.textContent = note;
      actions.append(paragraph);
    }
    const details = document.createElement('a');
    details.href = '#' + home.anchor;
    details.textContent = 'Смотреть подробнее ↓';
    const contact = document.createElement('a');
    const message = [
      `Здравствуйте, Юлия! Интересует вариант «${home.name}».`,
      Number.isFinite(preferences.budget) ? `Бюджет — ${formatRubles.format(preferences.budget)}.` : '',
      preferences.bedrooms ? `Спален нужно минимум ${preferences.bedrooms}.` : '',
      preferences.moveIn === 'now' ? 'Хочу сразу переехать.' : '',
      preferences.gas ? 'Подскажите, есть ли газ?' : ''
    ].filter(Boolean).join(' ');
    contact.href = 'https://t.me/vdom66?text=' + encodeURIComponent(message);
    contact.textContent = 'Написать Юлии ↗';
    actions.append(details, contact);
    row.append(actions);
    body.append(row);
  }
  result.append(table);
});
