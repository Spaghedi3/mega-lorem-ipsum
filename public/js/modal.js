import { CATEGORIES, STATUSES } from './constants.js';
import { validateItem } from './validate.js';
import { createItem, updateItem, deleteItem } from './api.js';

const dialog = document.querySelector('#item-dialog');
const form = document.querySelector('#item-form');
const titleEl = document.querySelector('#dialog-title');
const categorySelect = document.querySelector('#f-category');
const statusSelect = document.querySelector('#f-status');
const saveBtn = document.querySelector('#save-btn');
const formError = document.querySelector('#form-error');
const deleteDialog = document.querySelector('#delete-dialog');
const deleteForm = document.querySelector('#delete-form');
const deleteNameEl = document.querySelector('#delete-name');
const confirmInput = document.querySelector('#f-confirm');
const confirmBtn = document.querySelector('#confirm-delete-btn');
const deleteError = document.querySelector('#delete-error');

const FIELDS = ['name', 'category', 'price', 'stock', 'status'];
const CONFIRM_WORD = 'delete';

let editingId = null;
let onSaved = () => {};

let lastFocused = null;

let deletingId = null;
let deleteLastFocused = null;
let onDeleted = () => {};

function fillSelect(select, values) {
  select.replaceChildren();
  for (const value of values) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    select.append(option);
  }
}

fillSelect(categorySelect, CATEGORIES);
fillSelect(statusSelect, STATUSES);

export function openDialog({ title, trigger }) {
  lastFocused = trigger ?? document.activeElement;
  titleEl.textContent = title;
  dialog.showModal();
}

export function closeDialog() {
  dialog.close();
}

export function setOnSaved(fn) { onSaved = fn; }

function clearErrors() {
  for (const field of FIELDS) {
    document.querySelector(`#e-${field}`).textContent = '';
  }
  formError.textContent = '';
}

function showErrors(fields) {
  clearErrors();
  for (const [field, message] of Object.entries(fields)) {
    const el = document.querySelector(`#e-${field}`);
    if (el) el.textContent = message;
  }
  const first = FIELDS.find((f) => fields[f]);
  if (first) document.querySelector(`#f-${first}`).focus();
}

function fillForm(item) {
  form.elements.name.value = item?.name ?? '';
  form.elements.category.value = item?.category ?? CATEGORIES[0];
  form.elements.price.value = item?.price ?? '';
  form.elements.stock.value = item?.stock ?? '';
  form.elements.status.value = item?.status ?? STATUSES[0];
}

export function openCreate(trigger) {
  editingId = null;
  clearErrors();
  fillForm(null);
  openDialog({ title: 'Add item', trigger });
}

export function openEdit(item, trigger) {
  editingId = item.id;
  clearErrors();
  fillForm(item);
  openDialog({ title: `Edit ${item.name}`, trigger });
}

export function setOnDeleted(fn) { onDeleted = fn; }

export function openDelete(item, trigger) {
  deletingId = item.id;
  deleteLastFocused = trigger ?? document.activeElement;
  deleteNameEl.textContent = item.name;
  resetDeleteForm();
  deleteDialog.showModal();
}

function resetDeleteForm() {
  deleteForm.reset();
  confirmBtn.disabled = true;
  deleteError.textContent = '';
}

function enableBackdropClose(dialogEl) {
  dialogEl.addEventListener('click', (e) => {
    if (e.target !== dialogEl) return;
    const r = dialogEl.getBoundingClientRect();
    const inside =
      e.clientX >= r.left && e.clientX <= r.right &&
      e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) dialogEl.close();
  });
}

dialog.addEventListener('close', () => {
  form.reset();
  if (lastFocused?.isConnected) {
    lastFocused.focus();
  } else {
    document.querySelector('#add-btn').focus();
  }
  lastFocused = null;
});

document.querySelector('#dialog-close').addEventListener('click', closeDialog);
document.querySelector('#cancel-btn').addEventListener('click', closeDialog);

enableBackdropClose(dialog);
enableBackdropClose(deleteDialog);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const input = Object.fromEntries(new FormData(form));
  const { valid, fields, values } = validateItem(input);

  if (!valid) {
    showErrors(fields);
    return;
  }

  saveBtn.disabled = true;
  clearErrors();

  try {
    const saved = editingId === null
      ? await createItem(values)
      : await updateItem(editingId, values);

    closeDialog();
    onSaved(saved.data);
  } catch (err) {
    if (err.status === 422) {
      showErrors(err.fields);
    } else {
      formError.textContent = err.message;
    }
  } finally {
    saveBtn.disabled = false;
  }
});

confirmInput.addEventListener('input', () => {
  confirmBtn.disabled = confirmInput.value.trim().toLowerCase() !== CONFIRM_WORD;
});

deleteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (confirmBtn.disabled || deletingId === null) return;

  const id = deletingId;
  confirmBtn.disabled = true;

  try {
    await deleteItem(id);
    deleteDialog.close();
    onDeleted(id);
  } catch (err) {
    deleteError.textContent = err.status === 404
      ? 'This item no longer exists.'
      : err.message;
    confirmBtn.disabled = false;
  }
});

deleteDialog.addEventListener('close', () => {
  resetDeleteForm();
  if (deleteLastFocused?.isConnected) deleteLastFocused.focus();
  else document.querySelector('#add-btn').focus();
  deleteLastFocused = null;
  deletingId = null;
});

document.querySelector('#delete-close').addEventListener('click', () => deleteDialog.close());