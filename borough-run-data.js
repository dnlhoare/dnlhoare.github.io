/* Swap this configuration to create another edition. The engine reads only this data shape. */
window.BOROUGH_RUN_CONFIG = {
  title: 'Borough Run', version: '0.4.0', days: 30, startingCash: 2000, capacity: 100, currency: '£',
  goods: [
    { id:'acid', name:'Acid', unit:'tabs', base:520, min:180, max:1250, volatility:.58, glyph:'✳', tone:'violet', locations:['Camden','Hackney','Tower Hamlets','Islington','Lambeth'] },
    { id:'cocaine', name:'Cocaine', unit:'units', base:29954, min:18500, max:51000, volatility:.86, glyph:'◆', tone:'blue', locations:['Hackney','Tower Hamlets','Newham','Lewisham','Greenwich'] },
    { id:'crack', name:'Crack', unit:'units', base:2135, min:1250, max:3900, volatility:.8, glyph:'◇', tone:'coral', locations:['Camden','Islington','Westminster','Southwark','Lambeth'] },
    { id:'hashish', name:'Hashish', unit:'units', base:390, min:140, max:950, volatility:.5, glyph:'⬟', tone:'green', locations:['Richmond upon Thames','Hackney','Westminster','Tower Hamlets','Wandsworth'] },
    { id:'heroin', name:'Heroin', unit:'units', base:11716, min:6800, max:22000, volatility:.84, glyph:'⬢', tone:'pink', locations:['Newham','Brent','Haringey','Camden','Barking and Dagenham'] },
    { id:'mda', name:'MDA', unit:'units', base:1621, min:950, max:2900, volatility:.68, glyph:'✦', tone:'amber', locations:['Hackney','Camden','Southwark','Greenwich','Lewisham'] },
    { id:'mushrooms', name:'Mushrooms', unit:'units', base:165, min:55, max:430, volatility:.95, glyph:'☘', tone:'lime', locations:['Richmond upon Thames','Bromley','Enfield','Barnet','Hounslow'] },
    { id:'opium', name:'Opium', unit:'units', base:125, min:40, max:340, volatility:.72, glyph:'❋', tone:'orange', locations:['Camden','Haringey','Islington','Hackney','Waltham Forest'] },
    { id:'peyote', name:'Peyote', unit:'units', base:90, min:25, max:250, volatility:1.05, glyph:'♣', tone:'cyan', locations:['Newham','Tower Hamlets','Westminster','Ealing','Brent'] },
    { id:'speed', name:'Speed', unit:'units', base:38, min:10, max:100, volatility:.9, glyph:'⚡', tone:'orange', locations:['Southwark','Lambeth','Croydon','Greenwich','Barking and Dagenham'] },
    { id:'weed', name:'Weed', unit:'units', base:65, min:20, max:175, volatility:.62, glyph:'♧', tone:'lime', locations:['Islington','Hackney','Haringey','Lewisham','Waltham Forest'] }
  ],
  locations: [
    {name:'Camden', district:'North London', contact:'Mags', avatar:'M', lines:['Camden’s humming today. Hashish and weed prices are worth a look.','Word is the market’s thin on acid. Check the board before you buy.']},
    {name:'Hackney', district:'East London', contact:'Leon', avatar:'L', lines:['Hackney’s got a bit of everything if you know where to look.','Keep your eyes open. Cocaine and MDA prices can swing sharply.']},
    {name:'Westminster', district:'Central London', contact:'Rae', avatar:'R', lines:['Central London: big crowds, bigger price swings.','Hashish is drawing attention today. Check the latest market price.']},
    {name:'Newham', district:'East London', contact:'Dev', avatar:'D', lines:['Fresh stock comes through here all the time. Room in your bag?','Peyote and cocaine prices are moving around today.']},
    {name:'Islington', district:'North London', contact:'Kit', avatar:'K', lines:['A quieter day on the high street. Quiet doesn’t mean cheap.','Someone’s been asking about weed. Might be a short window.']},
    {name:'Southwark', district:'South London', contact:'Nia', avatar:'N', lines:['Good footfall by the river. Keep your head about you.','Speed prices are all over the place today. Take a look.']},
    {name:'Lambeth', district:'South London', contact:'Mo', avatar:'M', lines:['Market’s lively. Take your time and check the board.','Crack and acid have both been shifting today.']},
    {name:'Tower Hamlets', district:'East London', contact:'Sal', avatar:'S', lines:['You’ve got options here. Bag space is the real question.','Cocaine and hashish are the talk of the market today.']},
    {name:'Croydon', district:'South London', contact:'Jay', avatar:'J', lines:['Long way out, but there’s always a deal somewhere.','Vintage trainers are in demand round here — for now.']},
    {name:'Richmond upon Thames', district:'South West London', contact:'Eve', avatar:'E', lines:['A change of pace out here. Some surprisingly keen buyers.','Houseplants are all the rage with the locals.']},
    {name:'Brent', district:'North West London', contact:'Oz', avatar:'O', lines:['Brent’s got a lively market today. See what turns up.','Pocket gadgets are getting snapped up. Keep your options open.']},
    {name:'Greenwich', district:'South East London', contact:'Ash', avatar:'A', lines:['Nice day for a wander. A better day for a good price.','Cameras have a following round here. Have a look.']},
    {name:'Haringey', district:'North London', contact:'Liv', avatar:'L', lines:['People are out and about. Plenty of chatter, anyway.','Gig posters are having a moment. The market’s funny like that.']},
    {name:'Ealing', district:'West London', contact:'Bo', avatar:'B', lines:['Welcome west. Prices look different from the other side of town.','Pocket gadgets seem to be what people want today.']},
    {name:'Bromley', district:'South East London', contact:'Pip', avatar:'P', lines:['Further out, less rush. Take a breath and check those prices.','A few people are after houseplants. Who knew?']},
    {name:'Wandsworth', district:'South West London', contact:'Tess', avatar:'T', lines:['Busy borough today. Let the board do the talking.','Fancy tea’s been moving surprisingly quickly.']},
    {name:'Barnet', district:'North London', contact:'Ren', avatar:'R', lines:['Bit of a trek. Hope you packed light.','Houseplants are selling well — if you can find the right ones.']},
    {name:'Lewisham', district:'South East London', contact:'Bea', avatar:'B', lines:['Lewisham’s got a good mix today. You might find a bargain.','The camera crowd are back again. Must be the weather.']},
    {name:'Hounslow', district:'West London', contact:'Max', avatar:'M', lines:['A lot passing through today. Markets are all about timing.','Fancy tea’s in demand. Good day to check your stock.']},
    {name:'Enfield', district:'North London', contact:'Flo', avatar:'F', lines:['Welcome to Enfield. Let’s see what the day brings.','People have their eye on unusual plants today.']},
    {name:'Barking and Dagenham', district:'East London', contact:'Cam', avatar:'C', lines:['A fresh patch of town, a fresh set of prices.','Trainers are the word on the street this morning.']},
    {name:'Havering', district:'East London', contact:'Riz', avatar:'R', lines:['Havering’s a long way from the centre. Deals travel too.','Never underestimate the local taste for a good gadget.']},
    {name:'Harrow', district:'North West London', contact:'Elle', avatar:'E', lines:['Market’s settled in Harrow. See if anything catches your eye.','A few collectors have been asking after old records.']},
    {name:'Merton', district:'South West London', contact:'Finn', avatar:'F', lines:['Merton’s got a calm feel. Prices have their own ideas, though.','Houseplants are drawing a crowd today.']},
    {name:'Redbridge', district:'East London', contact:'Ivy', avatar:'I', lines:['You’ve made it to Redbridge. How’s the bag holding up?','The gadget stall’s been busy since opening.']},
    {name:'Hillingdon', district:'West London', contact:'Sol', avatar:'S', lines:['Plenty of ground left to cover. Keep an eye on your cash.','Tea’s catching on out here. Strange things happen.']},
    {name:'Waltham Forest', district:'East London', contact:'Mina', avatar:'M', lines:['Waltham Forest has a few surprises. Take a look around.','Posters are going quickly today. Might be the music crowd.']},
    {name:'Kensington and Chelsea', district:'Central London', contact:'Arlo', avatar:'A', lines:['A polished patch of town, but the market’s still a market.','People have expensive tastes. Fancy tea’s a safe bet today.']},
    {name:'Kingston upon Thames', district:'South West London', contact:'Noor', avatar:'N', lines:['Almost at the end of the route. Make this stop count.','A quiet word: people are looking for plants today.']},
    {name:'Bexley', district:'South East London', contact:'Kit', avatar:'K', lines:['Last borough. Let’s see what you made of the journey.','Final market of the run. Sell up and check your score.']}
  ],
  events: [
    {title:'Sudden shortage', text:'A supply disruption has made acid scarce. Its price has jumped to about 2.5 times its normal level.', goods:['acid'], multiplier:2.5},
    {title:'High-profile rumour', text:'Word spread about a cocaine shortage. Its market price has more than doubled.', goods:['cocaine'], multiplier:2.4},
    {title:'Street-level glut', text:'A sudden surplus of crack hit the market. Its price has plunged to about a quarter of normal.', goods:['crack'], multiplier:.25},
    {title:'Changing demand', text:'A rush for hashish has pushed its price to more than twice its normal level.', goods:['hashish'], multiplier:2.2},
    {title:'Supply scare', text:'A rumoured heroin shortage sent its price soaring to about 2.5 times normal.', goods:['heroin'], multiplier:2.5},
    {title:'Event crowd', text:'A busy night out has driven MDA prices to more than twice their normal level.', goods:['mda'], multiplier:2.3},
    {title:'Seasonal surplus', text:'A large mushrooms shipment arrived. Prices have plunged to about a quarter of normal.', goods:['mushrooms'], multiplier:.25},
    {title:'Market oversupply', text:'A bulk opium shipment arrived at once. Prices have plunged to about a quarter of normal.', goods:['opium'], multiplier:.25},
    {title:'Rare find', text:'A sudden shortage has sent peyote prices to nearly three times normal.', goods:['peyote'], multiplier:2.8},
    {title:'Fresh delivery', text:'Speed is in plentiful supply today. Prices have fallen to about a fifth of normal.', goods:['speed'], multiplier:.2},
    {title:'Local demand spike', text:'A jump in local demand pushed weed prices to more than twice normal.', goods:['weed'], multiplier:2.3}
  ],
  dialogue: { buy:'Picked up {qty} {item}. Mind the bag space.', sell:'Moved {qty} {item}. That’s £{total} in the till.', event:'{name} has turned the market on its head.' }
};

// This edition uses a compact, repeatable 8-stop pool; the engine can still use a longer location list.
window.BOROUGH_RUN_CONFIG.locations = window.BOROUGH_RUN_CONFIG.locations.slice(0, 8);
window.BOROUGH_RUN_CONFIG.goods.forEach(good => {
  good.locations = good.locations.filter(name => window.BOROUGH_RUN_CONFIG.locations.some(location => location.name === name));
});
