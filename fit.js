const form = document.querySelector('#fit-form');
const result = document.querySelector('#result');
const formatRubles = new Intl.NumberFormat('ru-RU', {
  style: 'currency', currency: 'RUB', maximumFractionDigits: 0
});
const homes = [
  { name: 'Готовый дом в Яснолетово', price: 14088800, bedrooms: 3, anchor: 'title', build: false },
  { name: 'SHiLO 124 в Зелёных кварталах', price: 12700000, bedrooms: 3, anchor: 'shilo', build: true },
  { name: 'Готовый дом в Лесных улочках', price: 16000000, bedrooms: 3, anchor: 'lesnye', build: false, repair: true },
  { name: 'HELEN HOUSE 120 в КП КраСоты', price: 27100000, bedrooms: 3, anchor: 'helen', build: false, finished: true },
  { name: 'Дом-шале 146,8 м², с. Патруши', price: 13900000, bedrooms: 3, anchor: 'polyana', build: false, finished: true },
  { name: 'BARNHOUSE 130, 149 м², КП КраСоты', price: 14500000, bedrooms: 3, anchor: 'barnhouse', build: false, finished: true },
  { name: 'Дом 136 м² в КП Европа, Берёзовский', price: 14000000, bedrooms: 3, anchor: 'europa', build: false },
  { name: 'Дом 180 м² в КП Зелёные кварталы 3', price: 13400000, bedrooms: 3, anchor: 'green180', build: false },
  { name: 'Дом М3, 140 м² в КП Рассоха Парк', price: 12700000, bedrooms: 3, anchor: 'rassoha', build: false, repair: true },
  { name: 'Дом в посёлке Бобровский', price: 8000000, bedrooms: 2, anchor: 'bobrovsky', build: false, finished: true, finishLabel: 'под ключ' },
  { name: 'Дом 115 м² в квартале Гранат, КП Заповедник', price: 17800000, bedrooms: 3, anchor: 'granat', build: false, finished: true, finishLabel: 'дизайнерский ремонт', gas: true }
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
  if (preferences.bedrooms > home.bedrooms) differences.push(`Спален по планировке — ${home.bedrooms}.`);
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

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const preferences = {
    budget: form.querySelector('#budget').valueAsNumber,
    bedrooms: Number(form.querySelector('#rooms').value),
    moveIn: form.querySelector('#finish').value,
    gas: form.querySelector('#gas').checked
  };
  const today = new Date();
  const matches = homes.map((home) => compareHome(home, preferences, today))
    .sort((a, b) => a.differences.length - b.differences.length || a.unknowns.length - b.unknowns.length);
  result.replaceChildren();
  for (const { home, price, differences, unknowns } of matches) {
    const card = document.createElement('article');
    card.className = 'match';
    const title = document.createElement('strong');
    title.textContent = home.name;
    const summary = document.createElement('p');
    const status = home.readinessUnknown ? 'комплектация по запросу' : home.finished ? (home.finishLabel ?? (home.anchor === 'helen' ? 'под тапочки' : 'с чистовой отделкой')) : home.repair ? (home.anchor === 'rassoha' ? 'под ключ, срок отделки по согласованию' : 'под ключ, дату готовности нужно уточнить') : home.build ? 'под строительство' : 'White Box';
    summary.textContent = [
      price === null ? 'Цена по запросу' : formatRubles.format(price),
      home.build && price !== null ? 'под строительство, цена по акции' : status
    ].join(' · ');
    card.append(title, summary);
    const notes = [...differences, ...unknowns];
    if (!notes.length) notes.push('Подходит по выбранным параметрам.');
    for (const note of notes) {
      const paragraph = document.createElement('p');
      paragraph.textContent = note;
      card.append(paragraph);
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
    card.append(details, contact);
    result.append(card);
  }
  result.hidden = false;
});
