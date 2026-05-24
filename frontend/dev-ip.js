const os = require('os');
const { execSync } = require('child_process');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  
  // 1. Gather all active adapters while filtering out loopback and virtual garbage
  const activeTargets = [];
  
  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    
    // Skip virtual network switches from Hyper-V, VMware, and VirtualBox
    if (lowerName.includes('vethernet') || lowerName.includes('vmnet') || lowerName.includes('virtualbox')) {
      continue;
    }

    for (const iface of interfaces[name]) {
      // Must be an active IPv4 address and not a local loopback (127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        activeTargets.push({ name: lowerName, address: iface.address });
      }
    }
  }

  // 2. Priority 1: Match real Wi-Fi or Wireless Adapters first
  const wifiMatch = activeTargets.find(t => t.name.includes('wi-fi') || t.name.includes('wlan') || t.name.includes('wireless'));
  if (wifiMatch) return wifiMatch.address;

  // 3. Priority 2: Match real physical Ethernet cards next
  const ethernetMatch = activeTargets.find(t => t.name.includes('ethernet'));
  if (ethernetMatch) return ethernetMatch.address;

  // 4. Fallback: Return first available active IPv4 address or localhost
  return activeTargets.length > 0 ? activeTargets[0].address : '127.0.0.1';
}

const localIp = getLocalIp();
console.log(`Connected on local IP -> ${localIp}`);

// Detect what action the user called (start vs android)
const isAndroid = process.argv.includes('android');
const clearCache = process.argv.includes('--clear') ? ' -c' : '';

const action = isAndroid ? `expo start --android${clearCache} --offline` : `expo start${clearCache} --offline`;

// Inject the environment binding dynamically directly into the active system shell context execution pass
try {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;
  // EXPOSE THE IP DYNAMICALLY TO THE FRONTEND RUNTIME VIA AN EXPO PUBLIC ENVIRONMENT TAG
  process.env.EXPO_PUBLIC_API_IP = localIp;
  
  execSync(`npx ${action}`, { stdio: 'inherit', env: process.env });
} catch (error) {
  // Graceful teardown
}
