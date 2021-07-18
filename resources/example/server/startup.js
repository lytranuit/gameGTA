/// <reference types="@altv/types-server" />
import alt from 'alt-server';

const spawn = {
    x: -1291.7142333984375,
    y: 83.43296813964844,
    z: 54.8916015625,
};

alt.log(`Server with example resource started.`);
alt.on('playerConnect', showAuthWindow);

function showAuthWindow(player) {
    alt.emitClient(player, 'auth:Open');
    console.log(`${player.name} has connected!`);
}
alt.on('auth:Done', exitAuthWindow);

function exitAuthWindow(player, id, username, email) {
    alt.emitClient(player, 'auth:Exit');
    console.log(`${player.name} has authenticated!`);
    console.log(`Their Database ID is: ${id}`);
    player.model = `mp_f_freemode_01`;
    player.spawn(spawn.x, spawn.y, spawn.z, 0);
}
