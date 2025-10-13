import { Component, OnInit, inject, Inject, PLATFORM_ID, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, GridApi, GridOptions, ModuleRegistry, AllCommunityModule, PaginationModule } from 'ag-grid-community';
import { UsersService } from '../../../services/users';
import { User, Role, RoleEntity } from '../../../model/user';
import { environment } from '../../../../environments/environment';
import { AG_GRID_LOCALE, gridTheme as sharedGridTheme } from '../sharedTable';
import { ActionButtonsComponent } from '../action-buttons-cell/action-buttons-cell';
import { ActionButtonsParams } from '../action-buttons-cell/action-buttons-param';
import { UserFormComponent, UserFormPayload } from './user-form/user-form';
import { UserDetailComponent } from './user-detail/user-detail';
import { debounceTime, Subject } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-admin-users',
  imports: [CommonModule, FormsModule, AgGridAngular, UserFormComponent, UserDetailComponent],
  styleUrls: ['./users.css'],
  templateUrl: `./users.html`,
})
export class Users implements OnInit {
  isBrowser: boolean = false;
  private api = inject(UsersService);

  // Fuente de datos
  users: User[] = [];
  // Datos mostrados por la tabla
  rowData: User[] = [];
  meId: number | null = null;

  showCreate = false;
  createDraft: {
    email: string;
    password: string;
    password2: string;
    full_name?: string;
    phone?: string;
    national_id?: string;
    selected_pet?: string;
    role: Role;
    enabled: boolean;
  } = { email: '', password: '', password2: '', role: 'CLIENT', enabled: true };
  createTouched = false;
  imgBrokenCreate = false;
  createLoading = false;
  emailExists = false;
  checkingEmail = false;
  private emailCheckSubject = new Subject<string>();

  // Editar - patrón servicios
  editing?: User;
  loading = false;
  selected?: User;

  allRoles: Role[] = ['ADMIN','OPERATOR','CLIENT'];

  // AG-Grid configuration
  readonly gridTheme: typeof sharedGridTheme = sharedGridTheme;
  private gridApi?: GridApi<User>;

  @ViewChild('createDetails') private createDetails?: ElementRef<HTMLDetailsElement>;

  constructor(
    // Injection token describing the current runtime platform
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Should only run when the component is executed in the browser
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      // Tells ag-grid to use all the modules
      ModuleRegistry.registerModules([AllCommunityModule]);
    }

    // Configurar debounce para verificación de email
    this.emailCheckSubject.pipe(
      debounceTime(500) // Esperar 500ms después de que el usuario deje de escribir
    ).subscribe(email => {
      this.performEmailCheck(email);
    });
  }
  
  columnDefs: ColDef[] = [
    {
      headerName: 'ID',
      field: 'user_id',
      flex: 0.5,
      minWidth: 70,
      maxWidth: 100,
      sortable: true,
      filter: 'agNumberColumnFilter'
    },
    {
      headerName: 'Usuario',
      field: 'email',
      flex: 3,
      minWidth: 250,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: (params: any) => {
        const user = params.data as User;
        const imgSrc = user.selected_pet ? this.img(user.selected_pet) : '';
        const fullName = user.full_name || '—';
        
        return `
          <div class="d-flex align-items-center gap-3 h-100">
            ${imgSrc ? `<img src="${imgSrc}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #f0f0f0;">` : ''}
            <div class="d-flex flex-column justify-content-center">
              <div class="fw-semibold">${fullName}</div>
              <div class="text-muted small">${user.email}</div>
            </div>
          </div>
        `;
      }
    },
    {
      headerName: 'Roles',
      field: 'roles',
      flex: 1,
      minWidth: 120,
      sortable: true,
      cellRenderer: (params: any) => {
        const user = params.data as User;
        const roles = this.roleNames(user.roles);
        return `<div class="d-flex align-items-center h-100">${roles.map(role => `<span class="badge text-bg-secondary me-1">${role}</span>`).join('')}</div>`;
      }
    },
    {
      headerName: 'Activo',
      field: 'enabled',
      flex: 0.7,
      minWidth: 80,
      maxWidth: 120,
      sortable: true,
      filter: 'agSetColumnFilter',
      cellRenderer: (params: any) => {
        const user = params.data as User;
        const isEnabled = user.enabled !== false;
        const badgeClass = isEnabled ? 'text-bg-success' : 'text-bg-secondary';
        const text = isEnabled ? 'Sí' : 'No';
        return `<div class="d-flex align-items-center justify-content-center h-100"><span class="badge ${badgeClass}">${text}</span></div>`;
      }
    },
    {
      headerName: 'Acciones',
      field: 'actions',
      flex: 1.5,
      minWidth: 220,
      cellRenderer: ActionButtonsComponent,
      cellRendererParams: {
        onEdit: (user: User) => this.beginEdit(user),
        onDelete: (user: User) => this.remove(user)
      },
      sortable: false,
      filter: false
    }
  ];

  gridOptions: GridOptions<User> = {
    localeText: AG_GRID_LOCALE,
    rowSelection: 'single',
    rowHeight: 80,
    getRowId: params => params.data.user_id?.toString(),
    onGridReady: params => { 
      this.gridApi = params.api
      params.api.sizeColumnsToFit();
    },
    onGridPreDestroyed: () => {
      this.gridApi = undefined;
    },
    onSelectionChanged: params => {
      const [row] = params.api.getSelectedRows();
      this.selected = row;
    },
    columnDefs: this.columnDefs
  };

  // Base del backend para imágenes (/images/...) – usa backendBaseUrl si existe; si no, deriva de apiBaseUrl
  private backendBase = (environment as any).backendBaseUrl
    || (environment.apiBaseUrl ? environment.apiBaseUrl.replace(/\/api\/?$/, '') : '');

  ngOnInit() {
    this.load();
    const me = JSON.parse(localStorage.getItem('user') || 'null') as User | null;
    this.meId = me?.user_id ?? null;
  }

  emptyDraft() {
    return { email: '', role: 'CLIENT' as Role, enabled: true };
  }

  load() {
    this.api.getAll().subscribe(d => {
      const sortedUsers = d.sort((a,b)=>(a.user_id||0)-(b.user_id||0));
      this.users = sortedUsers;
      this.rowData = sortedUsers;
    });
  }

  // Helpers
  img(path?: string) {
    if (!path) return '';
    return path.startsWith('http') ? path : `${this.backendBase}${path}`;
  }

  roleNames(roles?: RoleEntity[] | string[]): string[] {
    if (!roles) return [];
    if (typeof roles[0] === 'string') return roles as string[];
    return (roles as RoleEntity[]).map(r => r.name);
  }

  isSelf(u: User) { return this.meId && u.user_id === this.meId; }

  // Validaciones
  isEmailValid(v?: string) { 
    if (!v) return false;
    const formatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return formatValid && !this.emailExists;
  }
  isPasswordOk(v?: string) { return !!v && v.length >= 6; }
  passwordsMatch(a?: string, b?: string) { return (a || '') === (b || ''); }

  // Método público que se llama desde el template
  checkEmailExists(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.emailExists = false;
      this.checkingEmail = false;
      return;
    }
    
    this.emailCheckSubject.next(email);
  }

  // Método privado que realiza la verificación real con debounce
  private performEmailCheck(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.emailExists = false;
      this.checkingEmail = false;
      return;
    }

    this.checkingEmail = true;
    this.api.existsByEmail(email).subscribe({
      next: (exists) => {
        this.emailExists = exists;
        this.checkingEmail = false;
      },
      error: () => {
        this.emailExists = false;
        this.checkingEmail = false;
      }
    });
  }

  onCreateToggle(event: Event): void {
    const details = event.target as HTMLDetailsElement;
    this.showCreate = details.open;
  }

  // Crear
  resetCreate() {
    this.createDraft = { email: '', password: '', password2: '', role: 'CLIENT', enabled: true };
    this.createTouched = false;
    this.imgBrokenCreate = false;
    this.emailExists = false;
    this.checkingEmail = false;
  }

  private closeCreatePanel(): void {
    const details = this.createDetails?.nativeElement;
    if (!details) return;

    details.open = false;          
    details.removeAttribute('open'); 
  }

  cancelCreate(): void {
    this.showCreate = false;
    this.createDraft = { email: '', password: '', password2: '', role: 'CLIENT', enabled: true };
    this.createLoading = false;
    this.createTouched = false;
    this.imgBrokenCreate = false;
    this.emailExists = false;
    this.checkingEmail = false;
    this.closeCreatePanel();
  }

  create(f: NgForm) {
    this.createTouched = true;
    this.createLoading = true;
    if (!this.isEmailValid(this.createDraft.email) ||
        this.emailExists ||
        !this.isPasswordOk(this.createDraft.password) ||
        !this.passwordsMatch(this.createDraft.password, this.createDraft.password2)) {
      this.createLoading = false;
      return;
    }

    const body: any = {
      email: this.createDraft.email,
      password: this.createDraft.password,
      full_name: this.createDraft.full_name,
      phone: this.createDraft.phone,
      national_id: this.createDraft.national_id,
      selected_pet: this.createDraft.selected_pet,
      enabled: this.createDraft.enabled,
      roles: [this.createDraft.role] // nombres de rol, como ya usabas
    };

    this.api.create(body).subscribe({
      next: u => {
        this.users = [u, ...this.users];
        this.rowData = [u, ...this.rowData];
        this.cancelCreate();
        f.resetForm();
        this.withGridApi(api => {
          api.applyTransaction({ add: [u], addIndex: 0 });
          api.refreshCells({ force: true });
        });
      },
      error: err => {
        this.createLoading = false;
        alert(err?.error?.message || err.message || 'Error al crear usuario');
      }
    });
  }

  // Editar
  beginEdit(u: User) {
    if (this.isSelf(u)) return; // No permitir editar a uno mismo
    
    this.editing = u;
  }

  cancelEdit() {
    this.editing = undefined;
    this.loading = false;
  }

  saveEdit(payload: UserFormPayload) {
    if (!this.editing) return;
    
    const draft = payload.draft;
    if (!this.isEmailValid(draft.email)) return;
    if (draft.password && (!this.isPasswordOk(draft.password) || !this.passwordsMatch(draft.password, draft.password2))) {
      return;
    }

    this.loading = true;

    const body: any = {
      email: draft.email,
      full_name: draft.full_name,
      phone: draft.phone,
      national_id: draft.national_id,
      selected_pet: draft.selected_pet,
      enabled: draft.enabled,
      roles: [draft.role]
    };
    if (draft.password) body.password = draft.password;

    this.api.update(this.editing.user_id, body).subscribe({
      next: upd => {
        Object.assign(this.editing!, upd);
        this.users = this.users.map(x => x.user_id === upd.user_id ? upd : x);
        this.rowData = this.rowData.map(x => x.user_id === upd.user_id ? upd : x);
        
        // Actualizar selected si es el mismo usuario
        if (this.selected && this.selected.user_id === upd.user_id) {
          this.selected = upd;
        }
        
        this.cancelEdit();
        this.withGridApi(api => {
          api.applyTransaction({ update: [upd] });
          api.refreshCells({ force: true });
        });
      },
      error: err => {
        this.loading = false;
        alert(err?.error?.message || err.message || 'Error al actualizar usuario');
      }
    });
  }

  onDetailEdit(user: User): void {
    this.beginEdit(user);
  }

  remove(u: User) {
    if (this.isSelf(u)) {
      alert('No puedes eliminar tu propio usuario.');
      return;
    }

    const finalizeDelete = () => {
      if (this.selected?.user_id === u.user_id) {
        this.selected = undefined;
      }
      this.users = this.users.filter(x => x.user_id !== u.user_id);
      this.rowData = this.rowData.filter(x => x.user_id !== u.user_id);
      this.withGridApi(api => {
        api.applyTransaction({ remove: [u] });
        api.deselectAll();
      });
    };

    const requestDelete = (cascade: boolean) => {
      this.api.delete(u.user_id, cascade).subscribe({
        next: finalizeDelete,
        error: err => {
          const hasReservations =
            err?.status === 409 ||
            /Referential integrity|FOREIGN KEY/i.test(err?.error || '');
          if (!cascade && hasReservations) {
            const goCascade = confirm(
              'Este usuario tiene reservas asociadas.\n' +
              '¿Quieres eliminar también sus reservas y continuar?'
            );
            if (goCascade) {
              requestDelete(true);
            }
            return;
          }
          alert(err?.error?.message || err.message || 'Error al eliminar usuario');
        }
      });
    };

    if (!confirm(`¿Eliminar a ${u.full_name || u.email}?`)) return;
    requestDelete(false);
  }

  // Search bar
  search: string = '';

  onSearch(term: string): void {
    this.search = term;
    this.withGridApi(api => api.setGridOption('quickFilterText', term || undefined));
  }

  private withGridApi(action: (api: GridApi<User>) => void): void {
    const api = this.gridApi;
    if (!api) return;
    const maybeDestroyed = (api as GridApi<User> & { isDestroyed?: () => boolean }).isDestroyed;
    if (typeof maybeDestroyed === 'function' && maybeDestroyed.call(api)) {
      return;
    }
    action(api);
  }
}
