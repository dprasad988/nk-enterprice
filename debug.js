try {
    console.log('Resolved electron path:', require.resolve('electron'));
} catch (e) {
    console.log('Resolve error:', e.message);
}

const electron = require('electron');
console.log('Electron export type:', typeof electron);
console.log('Process types:', process.type);
console.log('Versions:', process.versions);

if (typeof electron === 'string') {
    console.log('Is string value:', electron);
} else {
    console.log('Keys:', Object.keys(electron));
}

// Attempt to access app
if (electron && electron.app) {
    console.log('App is available');
    electron.app.quit();
} else {
    console.log('App is UNDEFINED');
    process.exit(1);
}
