export function isAdminRole(role) {
  return String(role || '').trim().toLowerCase() === 'admin';
}

export function isStaffRole(role) {
  return String(role || '').trim().toLowerCase() === 'staff';
}

export function isBackofficeRole(role) {
  return isAdminRole(role) || isStaffRole(role);
}

function normalizeAuthPayload(payload) {
  const user = payload?.user ?? null;
  const authenticated = Boolean(payload?.authenticated ?? payload?.success ?? user);
  const role = authenticated
    ? (
        payload?.role
        || (isAdminRole(user?.role) ? 'ADMIN' : (isStaffRole(user?.role) ? 'STAFF' : 'USER'))
      )
    : null;
  const redirectTo = authenticated
    ? (payload?.redirectTo || (role === 'ADMIN' || role === 'STAFF' ? '/admin' : '/'))
    : null;

  return {
    authenticated,
    user: authenticated ? user : null,
    role,
    redirectTo,
    message: payload?.message || '',
  };
}

export function normalizeSessionPayload(payload) {
  return normalizeAuthPayload(payload);
}

function buildLocationPath(locationLike) {
  const pathname = locationLike?.pathname || '/';
  const search = locationLike?.search || '';
  const hash = locationLike?.hash || '';
  return `${pathname}${search}${hash}`;
}

function isSafeReturnLocation(locationLike) {
  const pathname = locationLike?.pathname;

  if (!pathname || !pathname.startsWith('/')) {
    return false;
  }

  if (pathname === '/login' || pathname === '/register') {
    return false;
  }

  if (pathname.startsWith('/admin')) {
    return false;
  }

  return true;
}

export function resolvePostLoginDestination(authPayload, locationState) {
  const normalized = normalizeAuthPayload(authPayload);

  if (!normalized.authenticated || !normalized.user) {
    return { to: '/login' };
  }

  if (normalized.role === 'ADMIN' || normalized.role === 'STAFF') {
    return { to: '/admin' };
  }

  const from = locationState?.from;
  if (isSafeReturnLocation(from)) {
    return {
      to: buildLocationPath(from),
      state: from.state,
    };
  }

  return { to: normalized.redirectTo || '/' };
}
