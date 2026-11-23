// Inventaris van de schermen voor de visuele baseline. Elk scenario zet de app in een vaste toestand.
// land: ook liggend (kantinescherm) vastleggen. group: indeling in het rapport.
const P2 = "['Tom','Henk']", P4 = "['Tom','Henk','Imke','Jorn']";
const SUB = v => `document.getElementById('score-input').value='${v}';submitScore();`;
export const SCENARIOS = [
  // Start en navigatie
  { id: 'home', group: 'Start', label: 'Beginscherm met "Verder waar je was"', land: true, setup: `showScreen('screen-home');` },
  { id: 'home-leeg', group: 'Start', label: 'Beginscherm, nieuwe gebruiker (geen data)', empty: true, setup: `showScreen('screen-home');` },
  // Nieuw spel
  { id: 'setup-1-spelkeuze', group: 'Nieuw spel', label: 'Stap 1: spel kiezen', setup: `showScreen('screen-setup');goToSetupStep(1);` },
  { id: 'setup-2-x01', group: 'Nieuw spel', label: 'Stap 2: regels X01', setup: `showScreen('screen-setup');selectGame('x01');goToSetupStep(2);` },
  { id: 'setup-2-halveit', group: 'Nieuw spel', label: 'Stap 2: regels Halve It', setup: `showScreen('screen-setup');selectGame('halveit');goToSetupStep(2);` },
  { id: 'setup-2-randomco', group: 'Nieuw spel', label: 'Stap 2: regels Random Checkout', setup: `showScreen('screen-setup');selectGame('randomco');goToSetupStep(2);` },
  { id: 'setup-2-afgooien', group: 'Nieuw spel', label: 'Stap 2: regels Afgooien', setup: `showScreen('screen-setup');selectGame('afgooien');goToSetupStep(2);` },
  { id: 'setup-3-spelers', group: 'Nieuw spel', label: 'Stap 3: spelers en wie begint', setup: `showScreen('screen-setup');selectGame('x01');goToSetupStep(2);setupPlayers=${P2};goToSetupStep(3);` },
  // Spelschermen
  { id: 'x01-2sp', group: 'Spellen', label: '501, 2 spelers, uitgooi-route zichtbaar', land: true, setup: `launchGame('501',${P2},true,'firstto',3,1,501,0);${SUB(60)}state.scores=[121,140];state.currentPlayer=0;renderGame();` },
  { id: 'x01-4sp', group: 'Spellen', label: '501, 4 spelers (compact)', land: true, setup: `launchGame('501',${P4},true,'firstto',1,1,501,0);state.scores=[121,301,96,501];renderGame();` },
  { id: 'x01-teams', group: 'Spellen', label: '501, 2 tegen 2', setup: `_pendingTeams=[0,1,0,1];launchGame('501',${P4},false,'firstto',1,1,501,0);` },
  { id: 'x01-double-vraag', group: 'Spellen', label: '501: "Was het op een double?"', setup: `launchGame('501',${P2},true,'firstto',1,1,501,0);state.scores[0]=40;renderGame();${SUB(40)}` },
  { id: 'x01-dubbel-kiezen', group: 'Spellen', label: '501: welke dubbel', setup: `launchGame('501',${P2},true,'firstto',1,1,501,0);state.scores[0]=40;renderGame();${SUB(40)}[...document.querySelectorAll('#dbl-yn-overlay button')].pop().click();` },
  { id: 'x01-stats-blad', group: 'Spellen', label: '501: statistieken-onderblad', setup: `launchGame('501',${P2},true,'firstto',3,1,501,0);${SUB(100)}${SUB(45)}${SUB(60)}toggleX01Stats(true);` },
  { id: 'cricket', group: 'Spellen', label: 'Cricket', land: true, setup: `launchGame('cricket',${P2},true,'firstto',1,1,501,0);state.crMarks[0]=[3,2,1,0,0,0,0];state.crScores=[20,0];renderCricket();` },
  { id: 'atc', group: 'Spellen', label: 'Around the Clock', land: true, setup: `launchGame('atc',${P2},true,'firstto',1,1,501,0);` },
  { id: 'shanghai', group: 'Spellen', label: 'Shanghai, 4 spelers', land: true, setup: `launchGame('shanghai7',${P4},true,'firstto',1,1,501,0);` },
  { id: 'halveit', group: 'Spellen', label: 'Halve It', land: true, setup: `hiRandomOrder=false;hiSequence=DEFAULT_SEQ.map(function(s){return Object.assign({},s);});launchGame('halveit',${P2},true,'firstto',1,1,501,0);` },
  { id: 'bobs27', group: 'Spellen', label: "Bob's 27", land: true, setup: `launchGame('bobs27',${P2},true,'firstto',1,1,501,0);` },
  { id: 'checkout121', group: 'Spellen', label: '121 Checkout', land: true, setup: `launchGame('checkout121',${P2},true,'firstto',1,1,501,0);` },
  { id: 'randomco', group: 'Spellen', label: 'Random Checkout, 3 spelers', land: true, setup: `rcoCount=10;rcoMode='default';rcoDarts=9;launchRandomCheckout(['Tom','Henk','Imke']);` },
  { id: 'eliminatie', group: 'Spellen', label: 'Eliminatie', land: true, setup: `eliDoubleOut=false;eliTarget=301;launchGame('eliminatie',${P2},true,'firstto',1,1,501,0);` },
  { id: 'afgooien-bull', group: 'Spellen', label: 'Afgooien: bullronde', setup: `afgAssign='manual';afgTeams=0;afgLives=3;launchGame('afgooien',${P2},true,'firstto',1,1,501,0);` },
  { id: 'afgooien', group: 'Spellen', label: 'Afgooien: spel', land: true, setup: `afgAssign='random';afgTeams=0;afgLives=3;launchGame('afgooien',['Tom','Henk','Imke'],true,'firstto',1,1,501,0);closeGameSheet();` },
  { id: 'afgooien-nummers', group: 'Spellen', label: 'Afgooien: "Jullie nummers" bij de start', setup: `afgAssign='random';afgTeams=0;afgLives=3;launchGame('afgooien',['Tom','Henk','Imke'],true,'firstto',1,1,501,0);` },
  { id: 'potje-afronden', group: 'Spellen', label: '"Potje afronden?"', setup: `launchGame('atc',${P2},true,'firstto',1,1,501,0);state.atcTarget[0]=atcMaxTarget();renderATC();atcHitMult(1);` },
  // Uitslag
  { id: 'winst', group: 'Uitslag', label: 'Winstscherm 501', land: true, setup: `launchGame('501',${P2},false,'firstto',1,1,501,0);state.scores[0]=40;renderGame();${SUB(40)}document.getElementById('fin-ok').click();` },
  { id: 'verlies-solo', group: 'Uitslag', label: "Verliesscherm (Bob's 27 solo uit)", setup: `bobStopNeg=true;launchGame('bobs27',['Tom'],true,'firstto',1,1,501,0);for(var i=0;i<8&&_curScreen!=='screen-win';i++){if(document.getElementById('fin-ok')){document.getElementById('fin-ok').click();break;}bobThrow(0);}` },
  { id: 'rematch', group: 'Uitslag', label: 'Rematch: wie begint', setup: `launchGame('501',${P2},false,'firstto',1,1,501,0);state.scores[0]=40;renderGame();${SUB(40)}document.getElementById('fin-ok').click();rematch();` },
  // Geschiedenis, statistieken, ranglijst
  { id: 'geschiedenis', group: 'Overzichten', label: 'Geschiedenis', setup: `historySelectedPlayer='Tom';showScreen('screen-history');` },
  { id: 'geschiedenis-detail', group: 'Overzichten', label: 'Geschiedenis: potje open met legtabel', setup: `historySelectedPlayer='Tom';showScreen('screen-history');var el=[...document.querySelectorAll('#history-content [onclick^="toggleHistoryDetail"]')].find(function(x){return /501/.test(x.innerText);});if(el)el.click();` },
  { id: 'statistieken', group: 'Overzichten', label: 'Statistieken: Tom, alle spellen', setup: `statsSelectedPlayer='Tom';showScreen('screen-stats');` },
  { id: 'statistieken-x01', group: 'Overzichten', label: 'Statistieken: Tom, filter 501', setup: `statsSelectedPlayer='Tom';statsGameFilter.Tom='501';showScreen('screen-stats');` },
  { id: 'ranglijst', group: 'Overzichten', label: 'Ranglijst: winst', land: true, setup: `showScreen('screen-leaderboard');renderLeaderboard('wins');` },
  // Instellingen
  { id: 'instellingen', group: 'Instellingen', label: 'Instellingen-menu', setup: `showScreen('screen-settings');` },
  { id: 'inst-account', group: 'Instellingen', label: 'Account (niet ingelogd)', setup: `showScreen('screen-settings');stOpen('account');` },
  { id: 'inst-vrienden', group: 'Instellingen', label: 'Vrienden (niet ingelogd)', setup: `showScreen('screen-settings');stOpen('friends');` },
  { id: 'inst-account-ingelogd', group: 'Instellingen', label: 'Account (ingelogd als tom)', user: { uid: 'uT', email: 'tom@dartsbytom.app' }, fb: { 'users/uT': { username: 'tom', player: 'Tom' } }, setup: `showScreen('screen-settings');stOpen('account');` },
  { id: 'inst-vrienden-ingelogd', group: 'Instellingen', label: 'Vrienden (ingelogd, 2 vrienden)', user: { uid: 'uT', email: 'tom@dartsbytom.app' }, fb: { 'users/uT': { username: 'tom', player: 'Tom' }, 'users/uT/friends/uH': { username: 'henk', since: 1763500000000 }, 'users/uT/friends/uI': { username: 'imke', since: 1763500000000 }, 'users/uH/public/stats': { player: 'Henk' } }, ls: { darts_friend_links: JSON.stringify({ Henk: { uid: 'uH', username: 'henk' } }) }, setup: `showScreen('screen-settings');stOpen('friends');` },
  { id: 'inst-spelers', group: 'Instellingen', label: 'Spelers', setup: `showScreen('screen-settings');stOpen('players');` },
  { id: 'inst-spel', group: 'Instellingen', label: 'Spel (omroeper, geluid)', setup: `showScreen('screen-settings');stOpen('game');` },
  { id: 'inst-weergave', group: 'Instellingen', label: 'Weergave', setup: `showScreen('screen-settings');stOpen('appearance');` },
  { id: 'inst-gegevens', group: 'Instellingen', label: 'Gegevens met foutlog en synchronisatieproblemen', errlog: true, setup: `_compatNote('Back-up','Gast','geen geldige spelergegevens');showScreen('screen-settings');stOpen('data');` },
  // Toernooi
  { id: 'toernooi-setup', group: 'Toernooi', label: 'Toernooi opzetten', setup: `showScreen('screen-trn-setup');` },
  { id: 'toernooi-overzicht', group: 'Toernooi', label: 'Toernooi: overzicht round robin', land: true, setup: `trnPlayers=${P4};trnFormat='roundrobin';trnBO=3;trnDoubleOut=true;trnGame=501;startTournament();` },
  { id: 'toernooi-stand', group: 'Toernooi', label: 'Toernooi: stand', setup: `trnPlayers=${P4};trnFormat='roundrobin';trnBO=3;trnDoubleOut=true;trnGame=501;startTournament();showScreen('screen-trn-standings');renderStandings();` },
];
export const PHONES = [[375, 667, 'se'], [390, 844, 'mobiel'], [430, 932, 'groot']];
export const LANDS = [[1280, 800, 'kantine-1280'], [1920, 1080, 'kantine-1920']];
