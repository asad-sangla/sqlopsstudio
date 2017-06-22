# UX Guidelines for Flyout Dialog

All flyout dialogs in Carbon should consist of 3 parts: header, body, and footer. The body part should have a vertical scroll bar if the content overflows. The common flyout code is in src\sql\parts\common\flyoutDialog folder. The common styling for flyout and controllers is in src\sql\parts\common\flyoutDialog\media\flyoutDialog.css. Please use the class names that are in flyoutDialog.css.

<img src='../images/addGroupDialog.png' width='400px' />

# Accessibility
- User should be able to complete the task using only keyboard
- Use tab and ctrl+tab to navigate through the dialog
- Esc key should close the dialog
- Enter key should submit and close the dialog

# Error handling
The dialog should check for the required and valid inputs. If it is in the error stage, the input box will have a red border and contain the error message. The error message consists of error icon and error message. It will show below the form. For synchronized task, if there is an error from the engine after the form is submited, the error dialog should be shown.

- Error from input validation

	<img src='../images/addGroupDialog_error.png' width='400px' />

- Error from the engine

	<img src='../images/error_dialog.png' width='400px' />


# Common Controls
Most flyout body contains the common controls. The styling for common controls should define in src\sql\parts\common\flyoutDialog\media\flyoutDialog.css.

 ### OK/Cancel buttons
 All footer's buttons is blue color and white text. The selected stage should have white border.

<img src='../images/FooterButtons.png' width='250px' />

 ### dropdown inputs
 When it is selected, it should have blue border.

<img src='../images/dropdown.png' width='500px' />

 ### Input box
 When it is selected, it should have blue border.


<img src='../images/inputBox.png' width='500px' />

 ### Checkbox
 When it is selected, it should have blue border.

<img src='../images/checkbox.png' width='150px' />

