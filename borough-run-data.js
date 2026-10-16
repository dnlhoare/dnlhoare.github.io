/* Swap this configuration to create another edition. The engine reads only this data shape. */
window.BOROUGH_RUN_CONFIG = {
  title: 'Borough Run', days: 30, startingCash: 2000, capacity: 100, currency: '£',
  goods: [
    { id:'comics', name:'Bootleg comics', unit:'packs', base:38, volatility:.38, glyph:'▤', tone:'violet', locations:['Camden','Hackney','Tower Hamlets','Islington','Lambeth'] },
    { id:'synth', name:'Retro synths', unit:'units', base:125, volatility:.3, glyph:'♫', tone:'blue', locations:['Hackney','Tower Hamlets','Newham','Lewisham','Greenwich'] },
    { id:'vinyl', name:'Rare vinyl', unit:'crates', base:82, volatility:.25, glyph:'◉', tone:'amber', locations:['Camden','Islington','Westminster','Southwark','Lambeth'] },
    { id:'tea', name:'Fancy tea', unit:'tins', base:24, volatility:.2, glyph:'♨', tone:'green', locations:['Richmond upon Thames','Kensington and Chelsea','Hammersmith and Fulham','Westminster','Wandsworth'] },
    { id:'sneakers', name:'Vintage trainers', unit:'pairs', base:105, volatility:.34, glyph:'⌁', tone:'coral', locations:['Newham','Brent','Haringey','Croydon','Barking and Dagenham'] },
    { id:'cameras', name:'Old film cameras', unit:'units', base:175, volatility:.28, glyph:'▣', tone:'pink', locations:['Hackney','Camden','Southwark','Greenwich','Lewisham'] },
    { id:'plants', name:'Rare houseplants', unit:'pots', base:54, volatility:.4, glyph:'❋', tone:'lime', locations:['Richmond upon Thames','Bromley','Enfield','Barnet','Hounslow'] },
    { id:'posters', name:'Gig posters', unit:'rolls', base:31, volatility:.31, glyph:'▧', tone:'orange', locations:['Camden','Haringey','Islington','Hackney','Waltham Forest'] },
    { id:'gadgets', name:'Pocket gadgets', unit:'units', base:68, volatility:.3, glyph:'⌘', tone:'cyan', locations:['Newham','Tower Hamlets','Westminster','Ealing','Brent'] }
  ],
  locations: [
    {name:'Camden', district:'North London', contact:'Mags', avatar:'M', lines:['Camden’s humming today. Vinyl’s moving fast — don’t hang about.','Word is the gig crowd are after posters. Make of that what you will.']},
    {name:'Hackney', district:'East London', contact:'Leon', avatar:'L', lines:['Hackney’s got a bit of everything if you know where to look.','Keep your eyes open. Prices round here can turn on a sixpence.']},
    {name:'Westminster', district:'Central London', contact:'Rae', avatar:'R', lines:['Central London: big crowds, bigger swings. You didn’t hear it from me.','Fancy tea’s all anyone’s talking about. Might be a passing thing.']},
    {name:'Newham', district:'East London', contact:'Dev', avatar:'D', lines:['Fresh stock comes through here all the time. Room in your bag?','Trainers are flying off shelves today. Funny old market.']},
    {name:'Islington', district:'North London', contact:'Kit', avatar:'K', lines:['A quieter day on the high street. Quiet doesn’t mean cheap.','Someone’s been asking about vinyl. Might be worth a look.']},
    {name:'Southwark', district:'South London', contact:'Nia', avatar:'N', lines:['Good footfall by the river. Keep your head about you.','Cameras are getting attention today. Could be a short window.']},
    {name:'Lambeth', district:'South London', contact:'Mo', avatar:'M', lines:['Market’s lively. Take your time and check the board.','A few collectors have come through looking for records.']},
    {name:'Tower Hamlets', district:'East London', contact:'Sal', avatar:'S', lines:['You’ve got options here. Bag space is the real question.','Synths are a talking point today. No idea how long that’ll last.']},
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
    {title:'Tube delay', text:'A line closure has sent the crowd wandering. Trainers are suddenly in demand.', goods:['sneakers'], multiplier:1.9},
    {title:'Collectors’ fair', text:'A local collectors’ fair is in town. Rare vinyl and old cameras are fetching a premium.', goods:['vinyl','cameras'], multiplier:1.75},
    {title:'Gadget launch', text:'A new gadget launch has stolen the spotlight. Pocket gadgets are hard to find today.', goods:['gadgets'], multiplier:1.8},
    {title:'Gig night', text:'A surprise gig has the crowds out. Posters are selling before you can blink.', goods:['posters'], multiplier:2.1},
    {title:'Tea festival', text:'A neighbourhood tea festival is drawing a crowd. Fancy tins are in demand.', goods:['tea'], multiplier:2},
    {title:'Plant swap', text:'A community plant swap has everyone talking greenery. Rare pots are going cheap.', goods:['plants'], multiplier:.48},
    {title:'Stockroom find', text:'A seller found an old box in the stockroom. Bootleg comics are unusually cheap.', goods:['comics'], multiplier:.45},
    {title:'Market oversupply', text:'A delivery arrived all at once. Synths are going for a song.', goods:['synth'], multiplier:.5}
  ],
  dialogue: { buy:'Picked up {qty} {item}. Mind the bag space.', sell:'Moved {qty} {item}. That’s £{total} in the till.', event:'{name} has turned the market on its head.' }
};

// This edition uses a compact, repeatable 8-stop pool; the engine can still use a longer location list.
window.BOROUGH_RUN_CONFIG.locations = window.BOROUGH_RUN_CONFIG.locations.slice(0, 8);
window.BOROUGH_RUN_CONFIG.goods.forEach(good => {
  good.locations = good.locations.filter(name => window.BOROUGH_RUN_CONFIG.locations.some(location => location.name === name));
});
