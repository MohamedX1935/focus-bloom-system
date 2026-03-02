import {
  LayoutDashboard,
  CheckSquare,
  Moon,
  Dumbbell,
  Brain,
  Wallet,
  BedDouble,
  Smartphone,
  Target,
  BarChart3,
  Settings,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Habitudes", url: "/habitudes", icon: CheckSquare },
  { title: "Prière", url: "/priere", icon: Moon },
  { title: "Sport", url: "/sport", icon: Dumbbell },
  { title: "Productivité", url: "/productivite", icon: Brain },
  { title: "Finances", url: "/finances", icon: Wallet },
  { title: "Sommeil", url: "/sommeil", icon: BedDouble },
  { title: "Écran", url: "/ecran", icon: Smartphone },
  { title: "Objectifs", url: "/objectifs", icon: Target },
  { title: "Statistiques", url: "/statistiques", icon: BarChart3 },
  { title: "Paramètres", url: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-6">
        {!collapsed && (
          <div className="px-4 pb-4 mb-2">
            <h1 className="text-lg font-bold tracking-tight text-foreground">Discipline</h1>
            <p className="text-xs text-muted-foreground">Système de vie</p>
          </div>
        )}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-accent/60 transition-colors"
                      activeClassName="bg-accent text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
