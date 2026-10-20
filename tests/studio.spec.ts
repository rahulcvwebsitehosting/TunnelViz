import {test,expect} from '@playwright/test';

test('studio renders the 3D model with no tutor or runtime exceptions',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Tunnel design studio'})).toBeVisible();
 await expect(page.locator('canvas')).toBeVisible();
 await expect(page.getByText('3D view unavailable',{exact:true})).toHaveCount(0);
 await expect(page.getByText('AI Tutor',{exact:true})).toHaveCount(0);
 await expect(page.locator('.metric-strip')).toContainText('28.3 m²');
 await expect(page.getByRole('button',{name:/^inside$/i,exact:true})).toHaveAttribute('aria-pressed','true');
 expect(errors).toEqual([]);
});

test('invalid segment counts stay out of the model and can be corrected',async({page})=>{
 await page.goto('/');
 const field=page.getByLabel('Segments per ring',{exact:true});
 await field.fill('6.5');await field.press('Tab');
 await expect(page.getByRole('alert')).toHaveText('Enter a whole number.');
 await expect(field).toHaveAttribute('aria-invalid','true');
 await field.fill('8');await field.press('Tab');
 await expect(page.getByRole('alert')).toHaveCount(0);
 await expect(page.getByText('Unsaved changes',{exact:true})).toBeVisible();
});

test('saving persists edited geometry across a page reload',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Outer diameter',{exact:true}).fill('8');
 await page.getByLabel('Outer diameter',{exact:true}).press('Tab');
 await expect(page.locator('.metric-strip')).toContainText('50.3 m²');
 await page.getByRole('button',{name:'Save project',exact:true}).click();
 await expect(page.locator('.notice')).toContainText('Project saved in this browser');
 await page.reload();
 await expect(page.getByLabel('Outer diameter',{exact:true})).toHaveValue('8');
 await expect(page.locator('.metric-strip')).toContainText('50.3 m²');
});

test('construction methods change sections and respect model applicability',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'NATM Arched sprayed concrete'}).click();
 await expect(page.getByRole('heading',{name:'Horseshoe tunnel / NATM'})).toBeVisible();
 await expect(page.getByLabel('Bolt length',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Cut & Cover Rectangular concrete box'}).click();
 await expect(page.getByRole('heading',{name:'Rectangular tunnel / Cut & Cover'})).toBeVisible();
 await page.locator('.results-details > summary').click();
 await expect(page.getByText('Gaussian excavation-loss settlement is unavailable for cut-and-cover',{exact:false})).toBeVisible();
});

test('keyboard navigation, ground inputs, results and sources work',async({page})=>{
 await page.goto('/');
 await page.getByRole('tab',{name:'Geometry',exact:true}).focus();
 await page.keyboard.press('ArrowRight');
 await expect(page.getByRole('tab',{name:'Ground',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(page.getByLabel('Water level above crown',{exact:true})).toBeVisible();
 await page.getByLabel('Water level above crown',{exact:true}).fill('5');
 await page.getByLabel('Water level above crown',{exact:true}).press('Tab');
 await expect(page.locator('.metric-strip')).toContainText('107.9 kPa');
 await page.getByRole('button',{name:'Reference library',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Research & calculation methods',exact:true})).toBeVisible();
 await expect(page.getByRole('link',{name:'Open primary source',exact:false}).first()).toBeVisible();
});

test('reset and export provide real results',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Outer diameter',{exact:true}).fill('7');await page.getByLabel('Outer diameter',{exact:true}).press('Tab');
 const downloadEvent=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export',exact:true}).click();
 const download=await downloadEvent;expect(download.suggestedFilename()).toBe('tunnelviz-project.json');
 const stream=await download.createReadStream();const chunks:Buffer[]=[];
 for await(const chunk of stream!)chunks.push(Buffer.from(chunk));
 expect(JSON.parse(Buffer.concat(chunks).toString()).design.width).toBe(7);
 await page.getByRole('button',{name:'Reset design',exact:true}).click();
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await expect(page.getByLabel('Outer diameter',{exact:true})).toHaveValue('6');
});

test('comparison remains readable on a phone and uses the whole excavation face',async({page})=>{
 await page.setViewportSize({width:390,height:1000});await page.goto('/');
 await page.getByRole('button',{name:'Compare methods',exact:true}).click();
 await expect(page.getByText('Mixed Ground · from materials across the selected excavation face')).toBeVisible();
 await expect(page.getByRole('slider',{name:'Comparison tunnel length'})).toBeVisible();
 await expect(page.getByRole('row')).toHaveCount(4);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

for(const width of [390,768,1440])test(`layout fits ${width}px without horizontal overflow`,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');
 await expect(page.locator('canvas')).toBeVisible();
 const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(e=>e.getBoundingClientRect().right>window.innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:Math.round(e.getBoundingClientRect().right)})).slice(0,12));
 if(overflow.length)console.log('Overflow at',width,overflow);
 await page.screenshot({path:`docs/studio-${width}.png`,fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});


test('walkthrough is opt-in, stops on Escape and canvas interaction',async({page})=>{
 await page.goto('/');
 const start=page.getByRole('button',{name:'Walk through',exact:true});
 await expect(start).toHaveAttribute('aria-pressed','false');
 await start.click();
 await expect(page.getByRole('button',{name:'Pause walkthrough'})).toHaveAttribute('aria-pressed','true');
 await page.keyboard.press('Escape');
 await expect(start).toBeVisible();
 await start.click();
 await page.locator('canvas').click({position:{x:150,y:220}});
 await expect(start).toBeVisible();
 await page.getByRole('button',{name:'Section',exact:true}).click();
 await expect(page.getByRole('button',{name:'Section',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.metric-strip')).toContainText('28.3 m²');
});

test('reduced motion disables travel and remains responsive to preference changes',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.getByRole('button',{name:'Walk through',exact:true})).toBeDisabled();
 await expect(page.getByText('Reduced motion enabled',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Enable motion for this preview'}).click();
 await expect(page.getByRole('button',{name:'Walk through',exact:true})).toBeEnabled();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.getByRole('button',{name:'Walk through',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.getByRole('button',{name:'Walk through',exact:true})).toBeDisabled();
});

test('section preview follows geometry without changing analysis inputs',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Outer diameter',{exact:true}).fill('9');
 await page.getByLabel('Outer diameter',{exact:true}).press('Tab');
 await expect(page.getByRole('img',{name:'Circular section, 9.0 metres wide, 9.0 metres high'})).toBeVisible();
 await expect(page.locator('.metric-strip')).toContainText('63.6 m²');
});


test('walkthrough visibly travels and the paused camera stays still',async({page})=>{
 await page.goto('/');
 const canvas=page.locator('canvas');
 await expect(canvas).toBeVisible();
 const before=await canvas.screenshot();
 await page.getByRole('button',{name:'Walk through',exact:true}).click();
 // Let the entry transition finish and observe real travel, rather than just button state.
 await page.waitForTimeout(1400);
 const moving=await canvas.screenshot();
 expect(moving.equals(before)).toBe(false);
 await page.getByRole('button',{name:'Pause walkthrough'}).click();
 await page.waitForTimeout(600);
 const paused=await canvas.screenshot();
 await page.waitForTimeout(400);
 expect((await canvas.screenshot()).equals(paused)).toBe(true);
});


test('interface motion can be enabled independently and stops when disabled',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 const toggle=page.getByRole('button',{name:'Interface motion',exact:true});
 await expect(toggle).toHaveAttribute('aria-pressed','false');
 await toggle.click();
 await expect(page.locator('.app-shell')).toHaveAttribute('data-motion','on');
 await page.getByRole('tab',{name:'Ground',exact:true}).click();
 await expect(page.getByLabel('Water level above crown',{exact:true})).toBeVisible();
 await toggle.click();
 await expect(page.locator('.app-shell')).toHaveAttribute('data-motion','off');
 await page.getByRole('button',{name:'Compare methods',exact:true}).click();
 expect(await page.locator('main').evaluate(el=>el.getAnimations().length)).toBe(0);
 await page.getByRole('button',{name:'Design studio',exact:true}).click();
 await expect(page.getByRole('tab',{name:'Ground',exact:true})).toHaveAttribute('aria-selected','true');
});
