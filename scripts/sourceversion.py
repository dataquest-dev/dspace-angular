import subprocess
import sys
from datetime import datetime

RELEASE_TAG_BASE='drruk'

if __name__ == '__main__':
    ts = datetime.now()
    print(f"<h4>This info was generated on: <br> <strong> {ts} </strong> </h4>")

    cmd = 'git log -1 --pretty=format:"<h4>Git hash: <br><strong> %H </strong> <br> Date of commit: <br> <strong> %ai </strong></h4>"'
    # print(f">{cmd}")
    subprocess.check_call(cmd, shell=True)

    # cmd = 'git status --porcelain'
    # print(f">{cmd}:")
    # subprocess.check_call(cmd, shell=True)

    link = sys.argv[1] + sys.argv[2]
    print('<br> <h4>Build run: </h4> <a href="' + link + '"> ' + link + '</a> ')

    link = "https://github.com/dataquest-dev/dspace-angular/releases/tag/" + RELEASE_TAG_BASE + "-" + datetime.now().strftime('%Y.%m.') + sys.argv[2]
    print('<br> <br> <h4>Release link: </h4><a href="' + link + '"> ' + link + '</a> (if it does not work, then this is not an official release instance) ')
