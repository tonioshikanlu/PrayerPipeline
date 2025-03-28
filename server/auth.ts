import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Define types for passport-local strategy callback 
type DoneCallback = (error: any, user?: SelectUser | false, info?: any) => void;

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configure session with settings for cross-domain use
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "prayer-pipeline-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: false, // Disable secure in development to allow HTTP
      sameSite: 'none',  // 'none' allows cross-site cookies (requires secure:true in production)
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    }
  };

  app.set("trust proxy", 1); // Trust first proxy for secure cookies behind reverse proxy
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password, name, email, role } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: "Invalid email address" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Check for existing email
      const users = await storage.getUsers();
      const emailExists = users.some(user => user.email === email);
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        name,
        email,
        role: role || "regular",
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      req.login(user, (loginErr: Error) => {
        if (loginErr) return next(loginErr);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      
      req.login(user, (loginErr: Error) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from response
        const { password, ...userWithoutPassword } = user as SelectUser;
        
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err: Error) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    
    res.json(userWithoutPassword);
  });
  
  // Special test endpoint that doesn't require authentication
  app.get("/api/test-connection", (req: Request, res: Response) => {
    res.json({
      success: true,
      message: "API connection successful",
      timestamp: new Date().toISOString(),
      origin: req.headers.origin || 'Unknown',
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'accept': req.headers['accept'],
      }
    });
  });
}
