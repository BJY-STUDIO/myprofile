//打开默认对话框
const openDialogBtn = document.getElementById('openDialogBtn');
const dialog = document.querySelector('md-dialog');

openDialogBtn.addEventListener('click', async () => {
    dialog.show();
});
