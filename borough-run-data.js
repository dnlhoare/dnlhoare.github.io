/* Swap this configuration to create another edition. The engine reads only this data shape. */
window.BOROUGH_RUN_CONFIG = {
  title: 'Borough Run', version: '1.0.0', days: 30, startingCash: 2000, capacity: 100, currency: '£',
  goods: [
    { id:'speed', name:'Speed', unit:'units', base:40, min:31, max:49, volatility:.9, glyph:'⚡', tone:'orange' },
    { id:'peyote', name:'Peyote', unit:'units', base:100, min:78, max:122, volatility:1.05, glyph:'♣', tone:'cyan' },
    { id:'weed', name:'Weed', unit:'units', base:240, min:187, max:293, volatility:.62, glyph:'♧', tone:'lime' },
    { id:'opium', name:'Opium', unit:'units', base:600, min:468, max:732, volatility:.72, glyph:'❋', tone:'orange' },
    { id:'mushrooms', name:'Mushrooms', unit:'units', base:1400, min:1092, max:1708, volatility:.95, glyph:'☘', tone:'lime' },
    { id:'hashish', name:'Hashish', unit:'units', base:3200, min:2496, max:3904, volatility:.5, glyph:'⬟', tone:'green' },
    { id:'acid', name:'Acid', unit:'tabs', base:7000, min:5460, max:8540, volatility:.58, glyph:'✳', tone:'violet' },
    { id:'crack', name:'Crack', unit:'units', base:15000, min:11700, max:18300, volatility:.8, glyph:'◇', tone:'coral' },
    { id:'mda', name:'MDA', unit:'units', base:30000, min:23400, max:36600, volatility:.68, glyph:'✦', tone:'amber' },
    { id:'heroin', name:'Heroin', unit:'units', base:60000, min:46800, max:73200, volatility:.84, glyph:'⬢', tone:'pink' },
    { id:'cocaine', name:'Cocaine', unit:'units', base:120000, min:93600, max:146400, volatility:.86, glyph:'◆', tone:'blue' }
  ],
  locations: [
    {name:'Camden', marketId:'camden', district:'North London', contact:'Mags', avatar:'M', lines:['Camden’s humming today. Hashish and weed prices are worth a look.','Word is the market’s thin on acid. Check the board before you buy.']},
    {name:'Hackney', marketId:'hackney', district:'East London', contact:'Leon', avatar:'L', lines:['Hackney’s got a bit of everything if you know where to look.','Keep your eyes open. Cocaine and MDA prices can swing sharply.']},
    {name:'Westminster', marketId:'westminster', district:'Central London', contact:'Rae', avatar:'R', lines:['Central London: big crowds, bigger price swings.','Hashish is drawing attention today. Check the latest market price.']},
    {name:'Newham', marketId:'newham', district:'East London', contact:'Dev', avatar:'D', lines:['Fresh stock comes through here all the time. Room in your bag?','Peyote and cocaine prices are moving around today.']},
    {name:'Islington', marketId:'islington', district:'North London', contact:'Kit', avatar:'K', lines:['A quieter day on the high street. Quiet doesn’t mean cheap.','Someone’s been asking about weed. Might be a short window.']},
    {name:'Southwark', marketId:'southwark', district:'South London', contact:'Nia', avatar:'N', lines:['Good footfall by the river. Keep your head about you.','Speed prices are all over the place today. Take a look.']},
    {name:'Lambeth', marketId:'lambeth', district:'South London', contact:'Mo', avatar:'M', lines:['Market’s lively. Take your time and check the board.','Crack and acid have both been shifting today.']},
    {name:'Tower Hamlets', marketId:'tower-hamlets', district:'East London', contact:'Sal', avatar:'S', lines:['You’ve got options here. Bag space is the real question.','Cocaine and hashish are the talk of the market today.']},
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
  dialogue: { buy:'Picked up {qty} {item}. Mind the bag space.', sell:'Moved {qty} {item}. That’s £{total} in the till.', event:'{name} has turned the market on its head.' }
};

// This edition uses a compact, repeatable 8-stop pool; the engine can still use a longer location list.
window.BOROUGH_RUN_CONFIG.locations = window.BOROUGH_RUN_CONFIG.locations.slice(0, 8);
