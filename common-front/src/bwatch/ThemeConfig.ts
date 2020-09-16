export type Theme = "dark" | "light";

export function detectTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function displayTheme(theme: Theme): void {
    document.body.setAttribute('data-theme', theme);
}


//
// function writeDarkSwitch(config: ThemeConfig) {
//     document.write(`
// <div class="custom-control custom-switch">
// <input type="checkbox" class="custom-control-input" id="darkSwitch">
// <label class="custom-control-label" for="darkSwitch">Dark Mode</label>
// </div>
// `);
//
//     const darkSwitch = document.getElementById('darkSwitch') as HTMLInputElement;
//
//     darkSwitch.checked = config.getTheme() === 'dark';
//     darkSwitch.onchange = () => {
//         config.setTheme(darkSwitch.checked ? 'dark' : 'light');
//     };
//
//     config.themeChangeHandlers.push(theme => darkSwitch.checked = theme === 'dark');
//
//     return darkSwitch;
// }
