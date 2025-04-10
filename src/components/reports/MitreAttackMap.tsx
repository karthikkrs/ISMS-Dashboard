import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRightIcon } from 'lucide-react';

// Dummy data representing a simplified attack flow based on MITRE ATT&CK tactics
const attackFlow = [
  { id: 'TA0001', name: 'Initial Access', techniques: ['T1566 - Phishing', 'T1190 - Exploit Public-Facing Application'] },
  { id: 'TA0002', name: 'Execution', techniques: ['T1059 - Command and Scripting Interpreter'] },
  { id: 'TA0005', name: 'Defense Evasion', techniques: ['T1027 - Obfuscated Files or Information'] },
  { id: 'TA0007', name: 'Discovery', techniques: ['T1082 - System Information Discovery'] },
  { id: 'TA0040', name: 'Impact', techniques: ['T1486 - Data Encrypted for Impact'] },
];

export function MitreAttackMap() {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Sample MITRE ATT&CK Flow Mapping</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This diagram illustrates a potential attack path based on observed indicators, mapped to MITRE ATT&CK tactics and techniques.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-2 overflow-x-auto pb-4">
          {attackFlow.map((tactic, index) => (
            <React.Fragment key={tactic.id}>
              <div className="flex-shrink-0 w-full sm:w-48">
                <Card className="h-full">
                  <CardHeader className="p-3">
                    <CardTitle className="text-sm font-semibold">{tactic.id}</CardTitle>
                    <p className="text-xs text-muted-foreground">{tactic.name}</p>
                  </CardHeader>
                  <CardContent className="p-3 text-xs">
                    <ul className="list-disc list-inside">
                      {tactic.techniques.map(tech => <li key={tech}>{tech}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              </div>
              {index < attackFlow.length - 1 && (
                <div className="flex-shrink-0 flex items-center justify-center mx-2">
                   <ArrowRightIcon className="h-6 w-6 text-gray-400 sm:rotate-0 rotate-90" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
