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
  { name: 'Дом-шале 146,8 м², с. Патруши', price: 13900000, bedrooms: 3, anchor: 'polyana', build: false, readinessUnknown: true },
  { name: 'BARNHOUSE 130, 149 м², КП КраСоты', price: 14500000, bedrooms: 3, anchor: 'barnhouse', build: false, finished: true },
  { name: 'Дом 136 м² в КП Европа, Берёзовский', price: 14000000, bedrooms: 3, anchor: 'europa', build: false }
];

const promotionEnds = new Date('2027-01-01T00:00:00+05:00');
const lesnyeOfferEnds = new Date('2026-12-01T00:00:00+05:00');
if (new Date() >= lesnyeOfferEnds) document.querySelector('#lesnye-offer').hidden = true;

if (new Date() >= promotionEnds) {
  document.querySelector('#shilo-price').textContent = 'Цена по запросу';
  document.querySelector('#promo-status').textContent = 'Срок акции завершился.';
  document.querySelector('#promo-terms').hidden = true;
}

function budgetPrice(home, today) {
  return home.build && today >= promotionEnds ? null : home.price;
}

function compareHome(home, preferences, today) {
  const price = budgetPrice(home, today);
  const differences = [];
  const unknowns = [];
  if (price === null) unknowns.push('Срок акции прошёл. Текущую цену нужно уточнить.');
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
  if (preferences.gas) unknowns.push('Наличие газа нужно уточнить.');
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
    const status = home.readinessUnknown ? 'комплектация по запросу' : home.finished ? 'с чистовой отделкой' : home.repair ? 'готовый дом' : home.build ? 'под строительство' : 'White Box';
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
