import React, { useContext, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Link,
  MenuItem,
  Menu,
  Avatar,
  Tooltip,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Circle as CircleIcon,
  RssFeed as RssFeedIcon,
  LiveTv as LiveTvIcon,
  ChatBubbleOutline as ChatIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
} from '@mui/icons-material';
import useAuth from '../hooks/useAuth';
import { AuthContext } from '../hooks/AuthContext';
import { useTranslation } from 'react-i18next';

const drawerWidth = 240;

const AppBar = styled(MuiAppBar)(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const navLinksStyle = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'inherit',
  mx: 2,
  '&:hover': {
    textDecoration: 'underline',
  },
};

const navLinkIconStyle = {
  mr: 1,
  display: 'flex',
  alignItems: 'center',
};

const navLinkItemStyle = {
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  color: 'inherit',
  py: 1,
  px: 2,
};

function DashboardContent() {
  const { t } = useTranslation();
  const { auth, setAuth } = useContext(AuthContext);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleOpenUserMenu = (event) => setAnchorElUser(event.currentTarget);

  const handleClickUserMenu = async (actionKey) => {
    if (actionKey === 'logout') {
      setAuth(null);
      // Trigger server logout but don't wait for it — reload immediately for instant UX
      logoutUser().catch(() => {});
      window.location.reload();
    } else if (actionKey === 'settings') {
      navigate('/settings');
    }

    setAnchorElUser(null);
    setDrawerOpen(false);
  };

  const getAvatarColor = (name) => {
    const colors = ['#F6851B', '#3C3C3B', '#E8E8E8'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  if (!auth) return null;

  const settings = [
    { key: 'greeting', label: t('nav.hi', { firstName: auth.firstName }), icon: null },
    { key: 'settings', label: t('nav.settings'), icon: <SettingsIcon sx={{ mr: 1 }} /> },
    { key: 'logout', label: t('nav.logout'), icon: <LogoutIcon sx={{ mr: 1 }} /> },
  ];

  const navItems = [
    { href: '/feed', label: t('nav.feed'), Icon: RssFeedIcon },
    { href: '/live', label: t('nav.live'), Icon: LiveTvIcon },
    { href: '/chat', label: t('nav.chat'), Icon: ChatIcon },
  ];

  const renderNavLinks = () => (
    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
      {navItems.map(({ href, label, Icon }) => (
        <Link
          key={label}
          href={href}
          target={href.startsWith('http') ? '_blank' : undefined}
          sx={navLinksStyle}
        >
          <Icon sx={navLinkIconStyle} />
          <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
            {label}
          </Typography>
        </Link>
      ))}
    </Box>
  );

  return (
    <>
      <AppBar position="absolute">
        <Toolbar
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: '24px',
          }}
        >
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ position: 'absolute', left: 16 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* LOGO (mismo estilo que el Login) */}
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', ml: 3 }}>
            <Link
              href="/"
              sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1, // igual que en Login
                }}
              >
                <Box
                  sx={{
                    width: 45,
                    height: 45,
                    borderRadius: '50%',
                    bgcolor: '#2186EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CircleIcon sx={{ color: 'white', fontSize: 18 }} />
                </Box>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 502, // igual que en Login
                    color: 'white',
                    lineHeight: 1,
                  }}
                >
                  chatty
                </Typography>
              </Box>
            </Link>
          </Box>

          {isMobile ? (
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              sx={{
                '& .MuiDrawer-paper': {
                  backgroundColor: '#2186EB',
                  color: 'white',
                },
              }}
            >
              <Box
                sx={{ width: drawerWidth, paddingTop: 8 }}
                role="presentation"
                onClick={() => setDrawerOpen(false)}
                onKeyDown={() => setDrawerOpen(false)}
              >
                <List>
                  {navItems.map(({ href, label, Icon }) => (
                    <ListItem
                      button
                      component={Link}
                      key={label}
                      href={href}
                      sx={{ ...navLinkItemStyle, color: 'white' }}
                      onClick={() => setDrawerOpen(false)}
                    >
                      <Icon sx={{ mr: 1, color: 'white' }} />
                      <ListItemText primary={label} sx={{ color: 'white' }} />
                    </ListItem>
                  ))}
                  <Divider />
                  {settings.map(({ key, label, icon }) => (
                    <ListItem
                      button
                      key={key}
                      onClick={() => handleClickUserMenu(key)}
                      sx={{ ...navLinkItemStyle, color: 'white' }}
                    >
                      {icon}
                      <ListItemText primary={label} sx={{ color: 'white' }} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Drawer>
          ) : (
            renderNavLinks()
          )}

          <Box>
            <Tooltip title={t('nav.open_settings')}>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenUserMenu(e);
                }}
                sx={{ p: 0 }}
              >
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(auth.firstName),
                    width: 35,
                    height: 35,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                >
                  {auth.firstName.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              sx={{ mt: '45px' }}
              anchorEl={anchorElUser}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map(({ key, label, icon }) => (
                <MenuItem key={key} onClick={() => handleClickUserMenu(key)}>
                  {icon}
                  <Typography textAlign="center">{label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
}

export default function Navbar() {
  return <DashboardContent />;
}