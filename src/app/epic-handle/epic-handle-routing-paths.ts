/**
 * The routing paths
 */
export const EPIC_HANDLE_TABLE_NEW_HANDLE_PATH = 'new-epic-handle';
export const EPIC_HANDLE_TABLE_EDIT_HANDLE_PATH = 'edit-epic-handle';

export const EPIC_HANDLE_TABLE_MODULE_PATH = 'epic-handle-table';
export function getEpicHandleTableModulePath() {
  return `/${EPIC_HANDLE_TABLE_MODULE_PATH}`;
}
