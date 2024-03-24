---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''

---

> [!IMPORTANT]
> Before you report the issue, please test/check the following first.

1. Remove the module and reinstall again

   <https://github.com/zanix/MMM-MealieMenu?#installation>

2. Try a minimal configuration

   Back up your config, then use the test configuration in the example folder. (rename it to `config.js`, then copy it to the main MagicMirror directory)

   If it works, the issue is possible with another module or just a misconfiguration.

3. Activate the front-end dev console

   <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>i</kbd> will open the front-dev console (Developer Tools) on your MagicMirror Screen. (Or in some environments, it will be the different key combination like <kbd>F12</kbd> or <kbd>Shift</kbd>+<kbd>Command</kbd>+<kbd>j</kbd>)

   In the `console` tab, you can see many helpful logs, including errors.

   If you find an error message pointing to the `MMM-MealieMenu` module that you think is related to the cause, report with a screen capture or a snap with your Handy.

   If you are using a dumb terminal and cannot open the front-end dev console with a keyboard, you can manually execute the MagicMirror in dev mode. (If you are using PM2, you should stop that first.)

     ```shell
     npm run start:dev
     ```

4. Create a detailed report

**Your device:** (e.g. RPI 4B 4GB, MBP M1Max)

**OS & Version:** (e.g. RPOS Bullseye, MacOS Sonoma)

**Node, NPM version:** (e.g. node 20.8.0, npm 10.1.0)
> [!TIP]
> You can check with `npm -v` and `node -v`

**MagicMirror version:** (e.g. 2.26.0)

**How you are running MagicMirror:** (e.g. Dedicated Electron client, Chrome Browser with Serveronly mode)

**Browser:** (Electron/Chromium) Version: (e.g. Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.5845.190 Electron/26.2.4 Safari/537.36)
> [!TIP]
> You can check this info by typing `navigator.userAgent` in the last line of the console tab of developer tools.

**Describe the bug:** A clear and concise description of what the bug is.

**To Reproduce:** Steps to reproduce the behavior

**Expected behavior:** A clear and concise description of what you expected to happen.

**Screenshots:** If applicable, add screenshots to help explain your problem.

**Additional context:** Add any other context about the problem here.
