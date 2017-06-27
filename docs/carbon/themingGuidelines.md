# Theming Guidelines
All UI in carbon should work with all themes. Background colors, foreground colors and boarder color should be controlled by IThemeService, the theming service.

# VS controls
All VS controls are themable. If you create controls using VS controls, you can simply apply styling using styler in 'vs/platform/theme/common/styler' and IThemeService from 'vs/platform/theme/common/themeService'.

Below are xample code from 'src/sql/parts/connection/connectionDialog/connectionWidget.ts'

```javascript
import { IThemeService } from 'vs/platform/theme/common/themeService';
import * as styler from 'vs/platform/theme/common/styler';

// Theme styler
this._toDispose.push(styler.attachInputBoxStyler(this._serverNameInputBox, this._themeService));
this._toDispose.push(styler.attachInputBoxStyler(this._databaseNameInputBox, this._themeService));
this._toDispose.push(styler.attachInputBoxStyler(this._userNameInputBox, this._themeService));
this._toDispose.push(styler.attachInputBoxStyler(this._passwordInputBox, this._themeService));
this._toDispose.push(styler.attachSelectBoxStyler(this._serverGroupSelectBox, this._themeService));
this._toDispose.push(styler.attachSelectBoxStyler(this._authTypeSelectBox, this._themeService));
this._toDispose.push(styler.attachButtonStyler(this._advancedButton, this._themeService));
this._toDispose.push(styler.attachCheckboxStyler(this._rememberPasswordCheckBox, this._themeService));

```

Here is how it works:
1. The styler in 'vs/platform/theme/common/styler' calls doAttachStyler.
2. doAttachStyler call style() in vs control. This method usaully saved the styling colors to local variables, and then call applyStyles()
3. applyStyles() is the function that actually applys the theming

## How to overwrite styling in VS controls
Styler in 'vs/platform/theme/common/styler' have an option to pass in style which can overwrite the default colors. It accepts ColorIdentifier. ColorIdentifier is in 'vs/platform/theme/common/colorRegistry'. It is the ID of registered color. You can see the list of registered color and default colors in colorRegistry.ts.

You should avoid overwriting styling as much as you can. In theory, all controls use the default behaviors. If you have to overwrite styling, please consult with our UX designer.
