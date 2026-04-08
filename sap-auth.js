#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

const MCP_CONFIG_FILE = '.mcp.json';
const ENCRYPTED_CONFIG_FILE = '.mcp.json.enc';
const VSP_COMMAND = '/Users/pabgonzalez/vibing-steampunk/vsp-darwin-arm64';

function encrypt(text, passphrase) {
    const salt = crypto.randomBytes(16);
    const key = crypto.scryptSync(passphrase, salt, 32);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return JSON.stringify({
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        data: encrypted
    });
}

function decrypt(encryptedData, passphrase) {
    const { salt, iv, authTag, data } = JSON.parse(encryptedData);
    const key = crypto.scryptSync(passphrase, Buffer.from(salt, 'hex'), 32);
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        key,
        Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function getPassphrase(isNew = false) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    
    const ask = () => {
        const question = isNew 
            ? 'Establece una contraseña para cifrar .mcp.json: '
            : 'Introduce la contraseña para descifrar .mcp.json: ';
        
        return new Promise(resolve => {
            rl.question(question, ans => {
                if (isNew && !isPasswordSecure(ans)) {
                    console.log('\n❌ La contraseña no es segura. Debe tener:');
                    console.log('   - Mínimo 8 caracteres');
                    console.log('   - Al menos una letra mayúscula');
                    console.log('   - Al menos una letra minúscula');
                    console.log('   - Al menos un número');
                    console.log('   - Al menos un carácter especial (!@#$%^&*...)\n');
                    ask().then(resolve);
                } else {
                    rl.close();
                    resolve(ans);
                }
            });
        });
    };

    return ask();
}

function isPasswordSecure(password) {
    if (!password || password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[a-z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    return true;
}

function prompt(rl, question) {
    return new Promise(resolve => rl.question(question, resolve));
}

const SYSTEM_GROUPS = [
    {
        name: 'S4 Corp',
        systems: [
            { id: 'DS4', label: 'Development', url: 'https://vhmcads4ci.rise.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_DS4_200' },
            { id: 'TS4', label: 'UAT',         url: 'https://vhmcats4ci.rise.melisap.com:44301/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_TS4_400' },
            { id: 'PS4', label: 'Production',  url: 'https://vhmcaps4ci.rise.melisap.com:44301/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_PS4_400' },
        ],
    },
    {
        name: 'S4 Funds',
        systems: [
            { id: 'MFD', label: 'Development', url: 'https://vhmcamfdci.rise.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_MFD_200' },
            { id: 'MFT', label: 'UAT',         url: 'https://vhmcamftci.rise.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_MFT_400' },
            { id: 'MFP', label: 'Production',  url: 'https://vhmcamfpci.rise.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_MFP_400' },
        ],
    },
    {
        name: 'S4 MX Banking',
        systems: [
            { id: 'MBD', label: 'Development', url: 'https://vhmxlmbdci.mxbank.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_MBD_200' },
            { id: 'MBT', label: 'UAT',         url: 'https://vhmxlmbtci.mxbank.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_MBT_400' },
            { id: 'MBP', label: 'Production',  url: 'https://vhmxlmbpci.mxbank.melisap.com:44300/sap/bc/ui2/flp', cookieNamePart: 'SAP_SESSIONID_MBP_400' },
        ],
    },
];

function createMcpConfig(vspCommand) {
    return {
        mcpServers: {
            "abap-adt": {
                command: vspCommand || VSP_COMMAND,
                args: ["--enable-transports"],
                env: {
                    "SAP_URL": "",
                    "SAP_USER": "",
                    "SAP_CLIENT": "",
                    "SAP_COOKIE_STRING": ""
                }
            }
        }
    };
}

async function selectSystem() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    try {
        console.log('\nSelecciona un grupo de sistemas:');
        SYSTEM_GROUPS.forEach((group, i) => {
            console.log(`  ${i + 1}) ${group.name}`);
        });

        const groupInput = await prompt(rl, '\nNúmero de grupo: ');
        const groupIndex = parseInt(groupInput, 10) - 1;

        if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= SYSTEM_GROUPS.length) {
            console.error('❌ Selección de grupo inválida.');
            process.exit(1);
        }

        const selectedGroup = SYSTEM_GROUPS[groupIndex];

        console.log(`\nSelecciona un sistema en "${selectedGroup.name}":`);
        selectedGroup.systems.forEach((sys, i) => {
            console.log(`  ${i + 1}) ${sys.id} - ${sys.label}`);
        });

        const sysInput = await prompt(rl, '\nNúmero de sistema: ');
        const sysIndex = parseInt(sysInput, 10) - 1;

        if (isNaN(sysIndex) || sysIndex < 0 || sysIndex >= selectedGroup.systems.length) {
            console.error('❌ Selección de sistema inválida.');
            process.exit(1);
        }

        return selectedGroup.systems[sysIndex];
    } finally {
        rl.close();
    }
}

async function runLaunch() {
    if (!fs.existsSync(ENCRYPTED_CONFIG_FILE)) {
        console.error(`❌ No se encontró ${ENCRYPTED_CONFIG_FILE}`);
        console.log('   Ejecuta primero sin --launch para crear la configuración.');
        process.exit(1);
    }

    const passphrase = await getPassphrase(false);

    try {
        const encryptedData = fs.readFileSync(ENCRYPTED_CONFIG_FILE, 'utf8');
        const decryptedStr = decrypt(encryptedData, passphrase);
        const decryptedObj = JSON.parse(decryptedStr);
        // Migración: asegurar que --enable-transports esté presente
        if (decryptedObj.mcpServers?.['abap-adt']) {
            const server = decryptedObj.mcpServers['abap-adt'];
            if (!server.args || !server.args.includes('--enable-transports')) {
                server.args = [...(server.args || []), '--enable-transports'];
            }
        }
        fs.writeFileSync(MCP_CONFIG_FILE, JSON.stringify(decryptedObj, null, 2));
        console.log('✅ Configuración descifrada.');
    } catch (err) {
        console.error('❌ Contraseña incorrecta o archivo corrupto.');
        process.exit(1);
    }

    console.log('🚀 Iniciando Claude Code...');
    
    const filteredArgs = process.argv.slice(2).filter(a => a !== '--launch' && a !== 'launch');
    const claude = spawn('claude', filteredArgs, {
        stdio: 'inherit',
        env: { ...process.env }
    });

    setTimeout(() => {
        try {
            fs.unlinkSync(MCP_CONFIG_FILE);
        } catch (err) {
        }
    }, 3000);

    claude.on('close', (code) => {
        process.exit(code);
    });
}

async function runAuthAndLaunch(selected, cookieString, sapUrl, sapClient, sapUser, passphrase, vspCommand) {
    let mcpConfig;
    if (fs.existsSync(MCP_CONFIG_FILE)) {
        try {
            const mcpConfigContent = fs.readFileSync(MCP_CONFIG_FILE, 'utf8');
            mcpConfig = JSON.parse(mcpConfigContent);
        } catch (err) {
            mcpConfig = createMcpConfig(vspCommand);
        }
    } else {
        mcpConfig = createMcpConfig(vspCommand);
    }

    if (mcpConfig.mcpServers && mcpConfig.mcpServers['abap-adt'] && mcpConfig.mcpServers['abap-adt'].env) {
        mcpConfig.mcpServers['abap-adt'].env.SAP_USER = sapUser;
        mcpConfig.mcpServers['abap-adt'].env.SAP_COOKIE_STRING = cookieString;
        mcpConfig.mcpServers['abap-adt'].env.SAP_URL = sapUrl;
        mcpConfig.mcpServers['abap-adt'].env.SAP_CLIENT = sapClient;

        fs.writeFileSync(MCP_CONFIG_FILE, JSON.stringify(mcpConfig, null, 2));
        
        const encrypted = encrypt(JSON.stringify(mcpConfig), passphrase);
        fs.writeFileSync(ENCRYPTED_CONFIG_FILE, encrypted);
        
        console.log('💾 .mcp.json actualizado.');
        console.log('🔐 .mcp.json.enc guardado.');
    } else {
        console.error('❌ No se encontró mcpServers.abap-adt.env en .mcp.json');
        return;
    }

    console.log('🚀 Iniciando Claude Code...');
    
    const claude = spawn('claude', process.argv.slice(2).filter(a => a !== '--launch' && a !== 'launch'), {
        stdio: 'inherit',
        env: { ...process.env }
    });

    setTimeout(() => {
        try {
            fs.unlinkSync(MCP_CONFIG_FILE);
        } catch (err) {
        }
    }, 3000);

    claude.on('close', (code) => {
        process.exit(code);
    });
}

async function installPuppeteer() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = await prompt(rl, '\n⚠️  Puppeteer no está instalado. ¿Instalar puppeteer? (s/n): ');
    rl.close();
    
    if (ans.toLowerCase() === 's' || ans.toLowerCase() === 'y') {
        console.log('📦 Instalando puppeteer...');
        try {
            execSync('npm install puppeteer', { stdio: 'inherit' });
            console.log('✅ Puppeteer instalado.');
            return true;
        } catch (err) {
            console.error('❌ Error al instalar puppeteer:', err.message);
            return false;
        }
    } else {
        console.log('❌ Se requiere puppeteer para continuar.');
        return false;
    }
}

async function main() {
    let puppeteer;
    try {
        puppeteer = require('puppeteer');
    } catch (e) {
        const installed = await installPuppeteer();
        if (!installed) {
            process.exit(1);
        }
        puppeteer = require('puppeteer');
    }

    const args = process.argv.slice(2);
    
    if (args.includes('--launch') || args.includes('launch')) {
        await runLaunch();
    } else {
        const selected = await selectSystem();

        console.log(`\n✅ Sistema seleccionado: ${selected.id} (${selected.label})`);
        console.log(`   URL: ${selected.url}\n`);

        let sapUser = '';
        let passphrase;
        let vspCommand = VSP_COMMAND;
        
        if (fs.existsSync(ENCRYPTED_CONFIG_FILE)) {
            passphrase = await getPassphrase(false);
            try {
                const encryptedData = fs.readFileSync(ENCRYPTED_CONFIG_FILE, 'utf8');
                const decrypted = JSON.parse(decrypt(encryptedData, passphrase));
                sapUser = decrypted.mcpServers?.['abap-adt']?.env?.SAP_USER || '';
                vspCommand = decrypted.mcpServers?.['abap-adt']?.command || VSP_COMMAND;
                if (sapUser) {
                    console.log(`👤 Usuario: ${sapUser}`);
                }
            } catch (err) {
                console.error('❌ Contraseña incorrecta o archivo corrupto.');
                process.exit(1);
            }
        } else {
            const rlUser = readline.createInterface({ input: process.stdin, output: process.stdout });
            sapUser = await prompt(rlUser, '\nUsuario SAP: ');
            rlUser.close();
            
            const rlVsp = readline.createInterface({ input: process.stdin, output: process.stdout });
            vspCommand = await prompt(rlVsp, `Ruta al ejecutable de VSP [${VSP_COMMAND}]: `);
            rlVsp.close();
            if (!vspCommand.trim()) {
                vspCommand = VSP_COMMAND;
            }
            
            passphrase = await getPassphrase(true);
        }

        console.log('🚀 Iniciando navegador...');

        const browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ['--start-maximized', '--ignore-certificate-errors'],
        });

        const page = await browser.newPage();

        try {
            console.log(`Por favor inicia sesión manualmente en: ${selected.url}`);
            await page.goto(selected.url, { waitUntil: 'domcontentloaded' });

            console.log('👀 Esperando cookie de sesión...');

            const maxRetries = 180;
            let foundCookie = null;

            for (let i = 0; i < maxRetries; i++) {
                const cookies = await page.cookies();
                foundCookie = cookies.find(c => c.name.includes(selected.cookieNamePart));

                if (foundCookie) break;

                await new Promise(r => setTimeout(r, 1000));
            }

            if (foundCookie) {
                console.log('\n✅ ¡Cookie capturada con éxito!');
                console.log(`Nombre: ${foundCookie.name}`);

                const cookieString = `${foundCookie.name}=${foundCookie.value}`;
                const sapUrl = new URL(selected.url).origin;
                const sapClient = foundCookie.name.slice(-3);

                await browser.close();
                console.log('👋 Navegador cerrado.');

                await runAuthAndLaunch(selected, cookieString, sapUrl, sapClient, sapUser, passphrase, vspCommand);
            } else {
                console.error('\n❌ Tiempo de espera agotado: no se encontró la cookie.');
                await browser.close();
            }

        } catch (err) {
            console.error('Ocurrió un error:', err);
            await browser.close();
        }
    }
}

main();
