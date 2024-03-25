const dialog = document.getElementById('dialog');
const openDialogBtn = document.getElementById('openDialogBtn');
const cancelBtn = document.getElementById('cancelBtn');
const okBtn = document.getElementById('okBtn');
const inputText = document.getElementById('inputText');

// 打开对话框
openDialogBtn.addEventListener('click', () => {
    dialog.style.display = 'block';
});

// 关闭对话框
function closeDialog() {
    dialog.style.display = 'none';
}

// 点击取消按钮
cancelBtn.addEventListener('click', () => {
    closeDialog();
});

// 点击确认按钮
okBtn.addEventListener('click', () => {
    const inputValue = inputText.value;
    alert('You entered: ' + inputValue);
    closeDialog();
});


dialog.addEventListener('close', () => {
    const cancelClicked = dialog.returnValue === 'cancel';
    const okClicked = dialog.returnValue === 'ok';
});