# COC Prep - Windows app (builds the .exe for free on GitHub)

1. In your GitHub repository click **Add file > Upload files** and drag the whole **`windows`** folder in. Commit.
2. Click **Add file > Create new file**, type the name `.github/workflows/build-windows.yml`, paste the text from
   `build-windows.yml.txt`, and commit.
3. Open the **Actions** tab, choose **Build Windows app**, click **Run workflow**. Wait about 6-10 minutes.
4. Open the green run, scroll to **Artifacts**, download **COC-Prep-Windows**, unzip it:
   - `COC-Prep-Setup.exe`    = installer (adds a Start menu and desktop icon). Works on 32-bit and 64-bit Windows.
   - `COC-Prep-Portable.exe` = no installation, just double-click (64-bit Windows).

If Windows shows "Windows protected your PC": click **More info**, then **Run anyway**.
The website address is in `windows/main.js` (START_URL).
