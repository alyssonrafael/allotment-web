const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
const plat = typeof navigator !== 'undefined' ? (navigator.platform || '') : ''

export const isMac = /Mac|iPhone|iPod|iPad/i.test(plat + ' ' + ua)

export const MOD_KEY = isMac ? '⌘' : 'Ctrl'
export const SHIFT_KEY = isMac ? '⇧' : 'Shift'
export const ALT_KEY = isMac ? '⌥' : 'Alt'
