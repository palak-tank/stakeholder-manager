import type { ElementType, ReactNode } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, CircleUser, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { BrandIcon } from '@/components/BrandIcon';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function NavItem({
  to,
  end,
  icon: Icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: ElementType;
  children: ReactNode;
}) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <NavLink to={to} end={end}>
          <Icon className="size-4" />
          {children}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-2">
          <BrandIcon className="size-5 shrink-0" />
          <span className="text-base font-semibold tracking-tight">Stakeholder Manager</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarMenu>
          <NavItem to="/" end icon={LayoutDashboard}>
            Dashboard
          </NavItem>
          <NavItem to="/stakeholders" icon={Users}>
            Stakeholders
          </NavItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2">
        {user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/80 outline-none hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-foreground">
                    <CircleUser className="size-4 shrink-0" />
                    <span className="truncate">{user.email}</span>
                    <ChevronsUpDown className="ml-auto size-4 opacity-50" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-(--radix-dropdown-menu-trigger-width)"
                >
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
