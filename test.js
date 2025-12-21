const electron = require('electron');
console.log('Type of electron export:', typeof electron);
console.log('Is string?', typeof electron === 'string');
if (typeof electron === 'object') {
    console.log('Has app?', !!electron.app);
}
console.log('Done.');
app.quit();
